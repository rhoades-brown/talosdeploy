# Talos Deploy

## Introduction

This deploys Talos into Proxmox using OpenTofu (Opensource Terraform) with Terragrunt.

## Configuration

Ensure the following tools are installed:

- [OpenTofu](https://opentofu.org/docs/intro/install/) - The opensource version of terraform
- [Terragrunt](https://terragrunt.gruntwork.io/docs/getting-started/install/) - Make terraform DRY
- [Kubernetes CLI](https://kubernetes.io/docs/tasks/tools/) - Essential tools to maintain kubernetes
- Talos CLI - Tool to maintain talos nodes

  ``` bash
  curl -sL https://talos.dev/install | sh
  ```

Optional/Recommended tools:

- [kubectx/kubens](https://github.com/ahmetb/kubectx) - Change the cluster and namespace context

### Proxmox Credentials

Proxmox credentials can be passed into OpenTofu using environment variables; this seems like the easiest way and the most secure.

```bash
export PM_USER=<username>@<realm>
export PM_PASS=<password>
```

## Deployment

Talos provide a pre-built image that is compatable with cloud-init. This allows booting the VM and supplying IP address, subnet, gateway and DNS. It also makes the process of deployment rather rapid.

### Create Template

1. In Proxmox UI, create a new VM, note the ID of the VM created.
   - General:
     - Name: `talos-template`
   - OS:
     - `Do not use any media`
     - `Guest OS Type: Linux`
     - Version: `6.x`
   - System:
     - Graphics Card: `VirtIO-GPU`
     - Machine: `q35`
     - BIOS: `SeaBIOS`
     - SCSI Controller: `VirtIO SCSI single`
   - Disks: `<NONE>` - Remove the scsi0 device
   - CPU:
     - Cores: `2`
   - Memory:
     - Memory (MiB): `2048`
   - Network:
     - Bridge: `vmbr0`
     - Model: `VirtIO`
1. Add the disk image
   1. SSH into the proxmox host.
   1. Curl the URL for the [latest talos `nocloud-amd64.raw.xz`](https://github.com/siderolabs/talos/releases/latest/).
   1. Decompress the image: `xz --decompress nocloud-amd64.raw.xz`
   1. Import the image into the VM: `qm importdisk <VM Id from step 1> nocloud-amd64.raw <disk store, usually local-lvm>^`
1. Import the disk image properly
   1. In Proxmox GUI, select the VM --> Hardware --> Hard Disk (scsi0) and click edit.
   1. Review the disk and save the changes.
1. Convert to Template
   1. Select the VM Choose More --> Convert to Template

### Create ArgoCD Secret

Create the secret

```bash
kubeseal <<EOF
---
apiVersion: v1
kind: Secret
metadata:
  name: private-repo-creds
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: repo-creds
stringData:
  type: git
  url: https://github.com/<GITHUB USERNAME>
  username: < GITHUB USERNAME >
  password: < PASSWORD >
EOF
```

### Create Cluster

```bash
cd terragrunt
terragrunt apply --target module.talos
```

Install the additional components:

```bash
terragrunt apply
```

### Setup the command line tools

```bash
terragrunt output -raw kube_config > $HOME/.kube/config
terragrunt output -raw talos_config > $HOME/.talos/config
```
