import * as pulumi from "@pulumi/pulumi";


export interface ArgoCdArgs {
    domain: string;
    githubPassword: pulumi.Input<string>;
    githubUsername: string;
    argoRepo: string;
    argoRepoPath: string;
    argoRepoRevision?: string;
    provider: pulumi.ProviderResource;
}
