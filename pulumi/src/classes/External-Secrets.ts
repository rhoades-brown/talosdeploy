import * as kubernetes from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';
import * as pulumiservice from "@pulumi/pulumiservice";

interface ExternalSecretsArgs {
    provider: kubernetes.Provider;
}

export class DeployExternalSecrets extends pulumi.ComponentResource {
    constructor(name: string, externalSecretsArgs: ExternalSecretsArgs, opts?: pulumi.ComponentResourceOptions) {
        super("pkg:rhoades-brown:external-secrets", name, {}, opts);

        // Helm chart is now managed by ArgoCD/Kargo.
        // retainOnDelete prevents Pulumi from deleting the release from the cluster,
        // and ignoreChanges prevents Pulumi from attempting any updates to it.
        // Explicit name prevents Pulumi auto-naming (e.g. external-secrets-af241177).
        // ArgoCD manages the same release by the name "external-secrets", so both must agree
        // on the name or they will install two separate copies and fight each other.
        const externalSecrets = new kubernetes.helm.v3.Release("external-secrets", {
            name: "external-secrets",
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
            retainOnDelete: true,
            ignoreChanges: ["*"],
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
        }, { ...opts, parent: accessToken, dependsOn: externalSecrets });

        // Bootstrap resource: must be created by Pulumi so it exists before ArgoCD
        // and any ExternalSecret resources are running. Do not move this to ArgoCD.
        const _externalSecretStore = new kubernetes.apiextensions.CustomResource("external-secret", {
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

        // Signal that all child resources have been registered
        this.registerOutputs({});
    }
}
