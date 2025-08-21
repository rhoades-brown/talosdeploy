import * as pulumi from '@pulumi/pulumi';
import { TalosHostArgs } from '../interfaces/TalosHost';
import { CreateProxmoxVm } from './CreateProxmoxVm';
import { CreateTalosConfig } from './CreateTalosConfig';


export class CreateTalosInstance extends pulumi.ComponentResource {
    public readonly ipAddress: string;
    public talosConfig?: CreateTalosConfig;

    constructor(name: string, talosHostArgs: TalosHostArgs, opts?: pulumi.ComponentResourceOptions) {
        super("pkg:rhoades-brown:talosHost", name, talosHostArgs, opts);
        this.ipAddress = talosHostArgs.ipAddress;

    }


    // Use the chain of responsibility pattern
    protected async initialize(talosHostArgs: TalosHostArgs, opts?: pulumi.ComponentResourceOptions): Promise<void> {
        const ProxmoxVM = new CreateProxmoxVm();
        this.talosConfig = new CreateTalosConfig();
        ProxmoxVM.setNext(this.talosConfig);

        await ProxmoxVM.handle(talosHostArgs, { ...opts, parent: this });
        this.ipAddress;
    }
}
