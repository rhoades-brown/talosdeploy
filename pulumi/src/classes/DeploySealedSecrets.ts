import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

export interface SealedSecretsArgs {
    provider: pulumi.ProviderResource;
    tlsCrt: pulumi.Input<string>;
    tlsKey: pulumi.Input<string>;
}

export class DeploySealedSecrets extends pulumi.ComponentResource {
    constructor(name: string, deploySealedSecrets: SealedSecretsArgs, opts?: pulumi.ComponentResourceOptions) {
        super("pkg:rhoades-brown:sealed-secrets", name, deploySealedSecrets, opts);
    }

    protected async initialize(deploySealedSecrets: SealedSecretsArgs, opts?: pulumi.ComponentResourceOptions): Promise<void> {
        const sealedSecretKeySecret = new kubernetes.core.v1.Secret("tls-secret", {
            metadata: {
                name: "sealed-secret-key",
                namespace: "kube-system",
                labels: {
                    "sealedsecrets.bitnami.com/sealed-secrets-key": "active",
                },
            },
            type: "kubernetes.io/tls",
            data: {
                "tls.crt": deploySealedSecrets.tlsCrt,
                "tls.key": deploySealedSecrets.tlsKey,

            },
        }, {
            ...opts,
            provider: deploySealedSecrets.provider,
            parent: this,
        });

    }
}
