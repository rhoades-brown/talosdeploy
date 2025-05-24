import * as proxmoxve from '@muhlba91/pulumi-proxmoxve';
import * as pulumi from '@pulumi/pulumi';
import { TalosHostArgs } from '../interfaces/TalosHost';
import { TalosInstanceHandler } from './TalosInstanceHander';

export class CreateProxmoxVm extends TalosInstanceHandler {
    async handle(request: TalosHostArgs, opts?: pulumi.ComponentResourceOptions): Promise<void> {
        request.VM = new proxmoxve.vm.VirtualMachine(request.name,
            {
                nodeName: request.nodeName,
                agent: {
                    enabled: true,
                    type: "virtio",
                },
                clone: {
                    vmId: request.templateId,
                    full: true,
                },
                cpu: {
                    type: "x86-64-v2-AES",
                },
                initialization: {
                    type: "nocloud",
                    dns: {
                        domain: request.domain,
                        servers: request.dns,
                    },
                    ipConfigs: [
                        {
                            ipv4: {
                                address: `${request.ipAddress}/${request.subnet}`,
                                gateway: request.gateway,
                            },
                        },
                    ]
                },
                memory: {
                    dedicated: request.dedicatedMemory,
                    floating: request.floatingMemory,
                },
                name: request.name,
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
            ...opts,
            provider: request.proxmoxConfig,
            ignoreChanges: ["disks"],
        });
        await super.handle(request, opts);
    }
}
