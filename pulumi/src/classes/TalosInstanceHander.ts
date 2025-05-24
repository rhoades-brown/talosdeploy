import { TalosHostArgs } from '../interfaces/TalosHost';
import * as pulumi from '@pulumi/pulumi';

export abstract class TalosInstanceHandler<T = TalosHostArgs> {
    protected nextHandler: TalosInstanceHandler<T> | null = null;

    setNext(handler: TalosInstanceHandler<T>): TalosInstanceHandler<T> {
        this.nextHandler = handler;
        return handler;
    }

    async handle(request: T, opts?: pulumi.ComponentResourceOptions): Promise<void> {
        if (this.nextHandler) {
            await this.nextHandler.handle(request, opts);
        }
    }
}
