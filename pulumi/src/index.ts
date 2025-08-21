import * as pulumi from "@pulumi/pulumi";
import * as proxmoxve from "@muhlba91/pulumi-proxmoxve";
import * as talos from "@pulumiverse/talos";
import { TalosClusterArgs, VmHostArgs } from "./interfaces/TalosHost";
import { CreateTalosInstance } from "./classes/CreateTalosInstance";
import * as kubernetes from "@pulumi/kubernetes";
import { DeployArgoCD } from "./classes/DeployArgoCD";
import { DeployExternalSecrets } from "./classes/External-Secrets";
import { getKubeconfig } from "@pulumiverse/talos/cluster/getKubeconfig";
import { machine } from "os";
const proxmoxConfig = new pulumi.Config("proxmox");
const talosConfig = new pulumi.Config();

const nodeName = proxmoxConfig.require("nodeName");
const proxmox_host = new proxmoxve.Provider("proxmoxve", {
  endpoint: proxmoxConfig.require("endpoint"),
  insecure: proxmoxConfig.getBoolean("insecure"),
  username: proxmoxConfig.require("username"),
  password: proxmoxConfig.requireSecret("password")
});

const talosTemplateName = talosConfig.require("templateName")
const talosTemplate = proxmoxve.vm.getVirtualMachines({
  filters: [
    {
      name: "name",
      values: [talosTemplateName]
    },
    {
      name: "template",
      values: ["true"]
    }
  ]
}, { provider: proxmox_host });


export const talosTemplateId = talosTemplate.then(talosTemplate => talosTemplate.vms[0].vmId);

const nvidiaTalosTemplateName = talosConfig.require("nvidiaTemplateName")
const nvidiaTalosTemplate = proxmoxve.vm.getVirtualMachines({
  filters: [
    {
      name: "name",
      values: [nvidiaTalosTemplateName]
    },
    {
      name: "template",
      values: ["true"]
    }
  ]
}, { provider: proxmox_host });

export const nvidiaTalosTemplateId = nvidiaTalosTemplate.then(nvidiaTalosTemplate => nvidiaTalosTemplate.vms[0].vmId);

const machineSecrets = new talos.machine.Secrets("secrets", {});

const workerConfig: any = {
  cluster: {
    proxy: {
      extraArgs: {
        "ipvs-strict-arp": true,
        "metrics-bind-address": "0.0.0.0:10249",
      }
    }
  }
}

const nvidiaWorkerConfig: any = {
  cluster: {
    proxy: {
      extraArgs: {
        "ipvs-strict-arp": true,
        "metrics-bind-address": "0.0.0.0:10249",
      }
    }
  },

  machine: {
    kernel: {
      modules: [
        { "name": "nvidia" },
        { "name": "nvidia_uvm" },
        { "name": "nvidia_drm" },
        { "name": "nvidia_modeset" },
      ]
    },
    sysctls:
      { "net.core.bpf_jit_harden": 1 }
  }
}

const controlplaneConfig: any = {
  cluster: {
    allowSchedulingOnControlPlanes: false,
    extraManifests: [
      "https://raw.githubusercontent.com/alex1989hu/kubelet-serving-cert-approver/main/deploy/standalone-install.yaml"
    ]
  },
  machine: {
    kubelet: {
      extraArgs: {
        "rotate-server-certificates": true
      }
    },
    network: {
      interfaces: [
        {
          deviceSelector: {
            busPath: "0*",
          },
          vip: {
            ip: "192.168.1.60",
          }
        }
      ]
    }
  }
};

const talosClusterArgs: TalosClusterArgs = {
  clusterName: "talos-pulumi",
  clusterEndpoint: "https://talos.rhoades-brown.local:6443",
  machineSecrets: machineSecrets,
};

const vmHostArgs: VmHostArgs = {
  proxmoxConfig: proxmox_host,
  subnet: 24,
  dns: ["192.168.1.21", "192.168.1.22"],
  domain: "rhoades-brown.local",
  gateway: "192.168.1.1",
  templateId: talosTemplateId,
  nodeName: nodeName,
  dedicatedMemory: 12 * 1024,
  floatingMemory: 12 * 1024,
};

const nvidiaVmHostArgs: VmHostArgs = {
  proxmoxConfig: proxmox_host,
  subnet: 24,
  dns: ["192.168.1.21", "192.168.1.22"],
  domain: "rhoades-brown.local",
  gateway: "192.168.1.1",
  templateId: nvidiaTalosTemplateId,
  nodeName: nodeName,
  dedicatedMemory: 12 * 1024,
  floatingMemory: 12 * 1024,
};



const controlplanes: CreateTalosInstance[] = [new CreateTalosInstance("controlplane01", {
  ...talosClusterArgs,
  ...vmHostArgs,
  type: "controlplane",
  ipAddress: "192.168.1.61",
  name: "controlplane01",
  dedicatedMemory: 6 * 1024,
  floatingMemory: 6 * 1024,
  config: [
    JSON.stringify(controlplaneConfig),
  ],
})];

export const nodes: CreateTalosInstance[] = [
  new CreateTalosInstance("node01", {
    ...talosClusterArgs,
    ...vmHostArgs,
    type: "worker",
    ipAddress: "192.168.1.71",
    name: "node01",
    config: [
      JSON.stringify(workerConfig),
    ],
  }, { dependsOn: controlplanes }),

  new CreateTalosInstance("node02", {
    ...talosClusterArgs,
    ...vmHostArgs,
    type: "worker",
    ipAddress: "192.168.1.72",
    name: "node02",
    config: [
      JSON.stringify(workerConfig),
    ],
  }, { dependsOn: controlplanes }),

  new CreateTalosInstance("node03", {
    ...talosClusterArgs,
    ...vmHostArgs,
    type: "worker",
    ipAddress: "192.168.1.73",
    name: "node03",
    config: [
      JSON.stringify(workerConfig),
    ],
  }, { dependsOn: controlplanes }),

  new CreateTalosInstance("nvidianode", {
    ...talosClusterArgs,
    ...nvidiaVmHostArgs,
    type: "worker",
    ipAddress: "192.168.1.74",
    name: "nvidianode",
    config: [
      JSON.stringify(nvidiaWorkerConfig),
    ],
  }, { dependsOn: controlplanes }),
];


export const config = talos.client.getConfigurationOutput({
  clusterName: "talos-pulumi",
  clientConfiguration: machineSecrets.clientConfiguration,
  nodes: controlplanes.concat(nodes).map(node => node.ipAddress),
}, { dependsOn: nodes });

const health = talos.cluster.getHealthOutput({
  clientConfiguration: config.clientConfiguration,
  skipKubernetesChecks: true,
  controlPlaneNodes: controlplanes.map(node => node.ipAddress),
  workerNodes: nodes.map(node => node.ipAddress),
  endpoints: controlplanes.map(node => node.ipAddress),
})

export const clusterHealth = config.clientConfiguration.apply(clientConfig => {
  return talos.cluster.getHealthOutput({
    clientConfiguration: clientConfig,
    skipKubernetesChecks: true,
    controlPlaneNodes: controlplanes.map(node => node.ipAddress),
    workerNodes: nodes.map(node => node.ipAddress),
    endpoints: controlplanes.map(node => node.ipAddress),
  })
});

export const kubeConfig = clusterHealth.clientConfiguration.apply(clientConfig => {
  return getKubeconfig({
    clientConfiguration: clientConfig,
    node: controlplanes[0].ipAddress,
  })
});

kubeConfig.kubeconfigRaw.apply(config => {
  console.log(config)
});

const kubernetsProvider = new kubernetes.Provider("kubernetes", {
  kubeconfig: kubeConfig.kubeconfigRaw,
});

const externalSecrets = new DeployExternalSecrets("external-secrets", {
  provider: kubernetsProvider
});


const argocd = new DeployArgoCD("argocd", {
  domain: "argocd.services.rhoades-brown.local",
  githubUsername: talosConfig.require("githubUsername"),
  githubPassword: talosConfig.requireSecret("githubPassword"),
  argoRepo: "https://github.com/rhoades-brown/argo-config.git",
  argoRepoPath: "apps",
  //argoRepoRevision: "initial",
  provider: kubernetsProvider,
}, {
  dependsOn: [externalSecrets]
});

export const talosConfiguration = config.talosConfig
