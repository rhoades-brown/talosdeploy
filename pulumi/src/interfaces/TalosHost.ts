import { Provider } from "@muhlba91/pulumi-proxmoxve";
import { VirtualMachine } from "@muhlba91/pulumi-proxmoxve/vm";
import * as pulumi from "@pulumi/pulumi";
import { Secrets } from "@pulumiverse/talos/machine/secrets";


export interface VmHostArgs {
    subnet: number;
    gateway: string;
    domain: string;
    proxmoxConfig: Provider;
    templateId: pulumi.Input<number>;
    dns: string[];
    nodeName: string;
    dedicatedMemory: number;
    floatingMemory: number;
};

export interface TalosClusterArgs {
    clusterName: string;
    clusterEndpoint: string;
    machineSecrets: Secrets,
}

export interface InstanceArgs {
    type: "controlplane" | "worker";
    name: string;
    ipAddress: string;
    VM?: VirtualMachine;
    config: Array<string>;
};

export interface TalosHostArgs extends VmHostArgs, TalosClusterArgs, InstanceArgs { };
