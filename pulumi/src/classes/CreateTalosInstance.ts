import * as pulumi from '@pulumi/pulumi';
import * as proxmoxve from '@muhlba91/pulumi-proxmoxve';
import * as talos from '@pulumiverse/talos';
import * as time from "@pulumiverse/time";
import { TalosHostArgs } from '../interfaces/TalosHost';


export class CreateTalosInstance extends pulumi.ComponentResource {
    public readonly ipAddress: string;
    public machineConfiguration: pulumi.Output<talos.machine.GetConfigurationResult>;

    constructor(name: string, args: TalosHostArgs, opts?: pulumi.ComponentResourceOptions) {
        super("pkg:rhoades-brown:talosHost", name, args, opts);
        this.ipAddress = args.ipAddress;

        // Create the VM
        const vm = new proxmoxve.vm.VirtualMachine(args.name, {
            nodeName: args.nodeName,
            agent: {
                enabled: true,
                type: "virtio",
            },
            clone: {
                vmId: args.templateId,
                full: true,
            },
            cpu: {
                type: "host",
                cores: args.cores,
                numa: true,
            },
            cdrom: {
                interface: "ide3",
                fileId: "none",
            },
            initialization: {
                type: "nocloud",
                dns: {
                    domain: args.domain,
                    servers: args.dns,
                },
                ipConfigs: [
                    {
                        ipv4: {
                            address: `${args.ipAddress}/${args.subnet}`,
                            gateway: args.gateway,
                        },
                    },
                ]
            },
            memory: {
                dedicated: args.dedicatedMemory,
                floating: args.floatingMemory,
            },
            name: args.name,
            networkDevices: [
                {
                    bridge: "vmbr0",
                    disconnected: false,
                    enabled: true,
                    firewall: true,
                }
            ],
            operatingSystem: {
                type: "l26",
            },
            serialDevices: [],
            vga: {
                memory: 4,
                type: "std",
            }
        }, {
            parent: this,
            provider: args.proxmoxConfig,
            ignoreChanges: ["disks", "cdrom"],
            deleteBeforeReplace: true
        });

        // Create the Talos configuration
        const disks = `
---
apiVersion: v1alpha1
kind: VolumeConfig
name: EPHEMERAL
provisioning:
  diskSelector:
    match: '!system_disk'
  minSize: 9GB
  grow: true
`;
        const nodeName = `${args.name}.${args.domain}`;
        this.machineConfiguration = talos.machine.getConfigurationOutput({
            clusterName: args.clusterName,
            clusterEndpoint: args.clusterEndpoint,
            machineSecrets: args.machineSecrets.machineSecrets,
            machineType: args.type,
            configPatches: [disks]
        });

        const ramResourcePropagation = new time.Sleep(`${args.name}-ramResourcePropagation`, {
            createDuration: "60s",
            triggers: {
                machineConfiguration: this.machineConfiguration.id,
            },
        }, { parent: vm });

        const configurationApply = new talos.machine.ConfigurationApply(`${args.name}-configuration`, {
            clientConfiguration: args.machineSecrets.clientConfiguration,
            machineConfigurationInput: this.machineConfiguration.machineConfiguration,
            node: args.ipAddress,
            configPatches: [
                ...args.config,
                JSON.stringify({
                    machine: {
                        kubelet: {
                            extraArgs: {
                                "rotate-server-certificates": true,
                            },
                        },
                        network: {
                            hostname: nodeName,
                        },
                        features: {
                            kubePrism: {
                                enabled: true,
                                port: 7445
                            },
                        },
                    }
                }),
            ],
        }, { parent: vm, dependsOn: [ramResourcePropagation] });

        if (args.type === "controlplane") {
            new talos.machine.Bootstrap(`${args.name}-bootstrap`, {
                node: args.ipAddress,
                clientConfiguration: args.machineSecrets.clientConfiguration,
            }, {
                parent: configurationApply,
                dependsOn: [configurationApply],
            });
        }

        // Signal that all child resources have been registered
        this.registerOutputs({
            ipAddress: this.ipAddress,
        });
    }
}
