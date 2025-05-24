import * as kubernetes from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';
import * as pulumiservice from "@pulumi/pulumiservice";

export class DeployExternalSecrets extends pulumi.ComponentResource {
    constructor(name: string, opts?: pulumi.ComponentResourceOptions) {
        super("pkg:rhoades-brown:external-secrets", name, {}, opts);
    }

    protected async initialize(externalSecretsArgs: any, opts?: pulumi.ComponentResourceOptions): Promise<void> {

        const externalSecrets = new kubernetes.helm.v3.Release("external-secrets", {
            namespace: "external-secrets",
            chart: "external-secrets",
            createNamespace: true,
            repositoryOpts: {
                repo: "https://charts.external-secrets.io",
            },
            values: {
                installCRDs: true,
            }
        }, {
            ...opts,
            provider: externalSecretsArgs.provider,
            parent: this,
        });


        const kubernetesEnvironment = pulumiservice.Environment.get("kubernetes", "rhoades-brown/proxmox/kubernetes", { ...opts, parent: this });

        const accessToken = new pulumiservice.AccessToken("external-secrets-token", {
            description: "Token for external secrets integration"
        }, { ...opts, parent: this });

        const pulumiAccessTokenSecret = new kubernetes.core.v1.Secret("patSecret", {
            metadata: {
                namespace: externalSecrets.namespace,
                name: "pulumi-access-token",
            },
            stringData: {
                PULUMI_ACCESS_TOKEN: accessToken.value,
            },
            type: "Opaque",
        });

        const externalSecretStore = new kubernetes.apiextensions.CustomResource("external-secret", {
            apiVersion: "external-secrets.io/v1",
            kind: "ClusterSecretStore",
            metadata: {
                name: "pulumi-secret-store",
                namespace: externalSecrets.namespace,
            },
            spec: {
                provider: {
                    pulumi: {
                        project: kubernetesEnvironment.project,
                        environment: kubernetesEnvironment.name,
                        organization: kubernetesEnvironment.organization,
                        accessToken: {
                            secretRef: {
                                name: pulumiAccessTokenSecret.metadata.name,
                                key: "PULUMI_ACCESS_TOKEN",
                                namespace: pulumiAccessTokenSecret.metadata.namespace,
                            }
                        }
                    }
                }
            }
        }, { ...opts, dependsOn: externalSecrets, parent: this });

    }
}
