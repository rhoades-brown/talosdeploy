import * as pulumi from '@pulumi/pulumi';
import * as _null from "@pulumi/null";
import * as talos from '@pulumiverse/talos';
import { TalosHostArgs } from '../interfaces/TalosHost';
import { TalosInstanceHandler } from './TalosInstanceHander';
import { Socket } from "net";
import * as time from "@pulumiverse/time";

export class CreateTalosConfig extends TalosInstanceHandler {

    async handle(request: TalosHostArgs, opts?: pulumi.ComponentResourceOptions): Promise<void> {



        const nodeName = `${request.name}.${request.domain}`;
        const machineConfiguration = talos.machine.getConfigurationOutput({
            clusterName: request.clusterName,
            clusterEndpoint: request.clusterEndpoint,
            machineSecrets: request.machineSecrets.machineSecrets,
            machineType: request.type,
        }, { ...opts, parent: request.VM });

        const ramResourcePropagation = new time.Sleep(`${request.name}-ramResourcePropagation`, {
            createDuration: "60s",
            triggers: {
                machineConfiguration: machineConfiguration.id,
            },
        });

        const configurationApply = new talos.machine.ConfigurationApply(`${request.name}-configuration`, {
            clientConfiguration: request.machineSecrets.clientConfiguration,
            machineConfigurationInput: machineConfiguration.machineConfiguration,
            node: request.ipAddress,
            configPatches: [
                ...request.config,
                JSON.stringify({
                    machine: {
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
                })],
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
            console.log(bootstrap.clientConfiguration);
        }
        await super.handle(request, opts);
    };
}
