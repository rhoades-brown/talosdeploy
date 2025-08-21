import * as pulumi from '@pulumi/pulumi';
import * as talos from '@pulumiverse/talos';
import { TalosHostArgs } from '../interfaces/TalosHost';
import { TalosInstanceHandler } from './TalosInstanceHander';
import * as time from "@pulumiverse/time";

export class CreateTalosConfig extends TalosInstanceHandler {
  public machineConfiguration!: pulumi.Output<talos.machine.GetConfigurationResult>;

  async handle(request: TalosHostArgs, opts?: pulumi.ComponentResourceOptions): Promise<void> {
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
    const nodeName = `${request.name}.${request.domain}`;
    this.machineConfiguration = talos.machine.getConfigurationOutput({
      clusterName: request.clusterName,
      clusterEndpoint: request.clusterEndpoint,
      machineSecrets: request.machineSecrets.machineSecrets,
      machineType: request.type,
      configPatches: [disks]
    }, { ...opts, parent: request.VM });

    const ramResourcePropagation = new time.Sleep(`${request.name}-ramResourcePropagation`, {
      createDuration: "60s",
      triggers: {
        machineConfiguration: this.machineConfiguration.id,
      },
    });

    const configurationApply = new talos.machine.ConfigurationApply(`${request.name}-configuration`, {
      clientConfiguration: request.machineSecrets.clientConfiguration,
      machineConfigurationInput: this.machineConfiguration.machineConfiguration,
      node: request.ipAddress,
      configPatches: [
        ...request.config,
        JSON.stringify({
          machine: {
            kubelet: {
              extraArgs: {
                // Certificate rotation is always enabled for all nodes to ensure security best practices.
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

    }, { ...opts, parent: request.VM, dependsOn: [ramResourcePropagation] });

    if (request.type === "controlplane") {
      const bootstrap = new talos.machine.Bootstrap(`${request.name}-bootstrap`, {
        node: request.ipAddress,
        clientConfiguration: request.machineSecrets.clientConfiguration,
      }, {
        ...opts,
        parent: configurationApply,
        dependsOn: [configurationApply],
      });
    }
    await super.handle(request, opts);
  };
}
