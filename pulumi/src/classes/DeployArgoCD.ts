import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import { ArgoCdArgs } from "../interfaces/ArgoCdArgs";

export class DeployArgoCD extends pulumi.ComponentResource {
    constructor(name: string, argoCdArgs: ArgoCdArgs, opts?: pulumi.ComponentResourceOptions) {
        super("pkg:rhoades-brown:argocd", name, argoCdArgs, opts);
    }

    protected async initialize(argoCdArgs: ArgoCdArgs, opts?: pulumi.ComponentResourceOptions): Promise<void> {

        const namespace = new kubernetes.core.v1.Namespace("argocd", {
            metadata: {
                name: "argocd",
            },
        }, {
            ...opts,
            provider: argoCdArgs.provider,
            parent: this,
        });

        //const redisPasswordResource = new random.RandomPassword("redis-password", { length: 16 });
        //const redisSecret = new kubernetes.core.v1.Secret("redis-secret", {
        //    metadata: {
        //        name: "argocd-redis",
        //        namespace: namespace.metadata.apply(metadata => metadata.name),
        //    },
        //    type: "Opaque",
        //    stringData: {
        //        auth: redisPasswordResource.result,
        //    },
        //}, {
        //    ...opts,
        //    provider: argoCdArgs.provider,
        //    parent: this
        //});

        const argocdHelm = new kubernetes.helm.v3.Release("argocd", {
            namespace: namespace.metadata.apply(metadata => metadata.name),
            chart: "argo-cd",
            repositoryOpts: {
                repo: "https://argoproj.github.io/argo-helm",
            },
            values: {
                global: {
                    domain: argoCdArgs.domain,
                },
                dex: {
                    enabled: false,
                },
                server: {
                    ingress: {
                        enabled: false,
                        annotations: {
                            "nginx.ingress.kubernetes.io/force-ssl-redirect": "true",
                            "nginx.ingress.kubernetes.io/backend-protocol": "HTTP"
                        }
                    },
                },
                config: {
                    params: {
                        "server.insecure": true
                    },
                }
            }
        }, {
            ...opts,
            provider: argoCdArgs.provider,
            parent: this,
        });

        //const argocdTemplate = new kubernetes.core.v1.Secret("argocd-repo-template", {
        //    metadata: {
        //        name: "private-repo-cred",
        //        namespace: namespace.metadata.apply(metadata => metadata.name),
        //        labels: {
        //            "argocd.argoproj.io/secret-type": "repo-creds"
        //        },
        //    },
        //    type: "Opaque",
        //    stringData: {
        //        type: "helm",
        //        url: "https://github.com/rhoades-brown",
        //        password: argoCdArgs.githubPassword,
        //        username: argoCdArgs.githubUsername,
        //    },
        //}, {
        //    ...opts,
        //    provider: argoCdArgs.provider,
        //    parent: this,
        //});

        const argocdBootstrap = new kubernetes.helm.v3.Release("argocd-bootstrap", {
            namespace: namespace.metadata.apply(metadata => metadata.name),
            chart: "../helm/argobootstrap",
            values: {

            }
        }, { dependsOn: [argocdHelm] });

        //const bootstrap = new kubernetes.yaml.v2.ConfigGroup("bootstrap", {
        //    objs: [{
        //        apiVersion: "argoproj.io/v1alpha1",
        //        kind: "Application",
        //        metadata: {
        //            name: "bootstrap",
        //            namespace: namespace.metadata.apply(metadata => metadata.name),
        //            finalizers: [
        //                "resources-finalizer.argocd.argoproj.io"
        //            ],
        //        },
        //        spec: {
        //            destination: {
        //                name: '',
        //                server: "https://kubernetes.default.svc",
        //                namespace: namespace.metadata.apply(metadata => metadata.name),
        //            },
        //            source: {
        //                path: argoCdArgs.argoRepoPath,
        //                repoURL: argoCdArgs.argoRepo,
        //                targetRevision: argoCdArgs.argoRepoRevision || "main",
        //            },
        //            project: "default",
        //            syncPolicy: {
        //                automated: {
        //                    prune: true,
        //                    selfHeal: true,
        //                }
        //            }
        //        },
        //    }]
        //}, {
        //    ...opts,
        //    provider: argoCdArgs.provider,
        //    parent: this,
        //    dependsOn: [argocdHelm],
        //});

    }
}
