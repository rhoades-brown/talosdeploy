import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { ArgoCdArgs } from "../interfaces/ArgoCdArgs";

export class DeployArgoCD extends pulumi.ComponentResource {
    constructor(name: string, argoCdArgs: ArgoCdArgs, opts?: pulumi.ComponentResourceOptions) {
        super("pkg:rhoades-brown:argocd", name, argoCdArgs, opts);
    }

    protected async initialize(argoCdArgs: ArgoCdArgs, opts?: pulumi.ComponentResourceOptions): Promise<void> {

        const argocdHelm = new kubernetes.helm.v3.Release("argocd", {
            namespace: "argocd",
            chart: "argo-cd",
            name: "argocd",
            createNamespace: true,
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
                        enabled: true,
                        tls: true,
                        annotations: {
                            "nginx.ingress.kubernetes.io/force-ssl-redirect": "true",
                            "nginx.ingress.kubernetes.io/backend-protocol": "HTTP"
                        }
                    },
                },
                configs: {
                    params: {
                        "server.insecure": "true",
                    },
                }
            }
        }, {
            ...opts,
            provider: argoCdArgs.provider,
            parent: this,
            retainOnDelete: true
        });

        const argocdBootstrap = new kubernetes.helm.v3.Release("argocd-bootstrap", {
            namespace: argocdHelm.namespace,
            chart: "../helm/argobootstrap",
            values: {}
        }, { dependsOn: [argocdHelm] });

    }
}
