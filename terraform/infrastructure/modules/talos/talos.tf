locals {
  controller = var.controllers[0].ipaddress
}

resource "talos_machine_secrets" "this" {}

data "talos_machine_configuration" "controlplane" {
  cluster_name     = var.cluster_name
  cluster_endpoint = var.cluster_endpoint
  machine_type     = "controlplane"
  machine_secrets  = talos_machine_secrets.this.machine_secrets
}

data "talos_machine_configuration" "worker" {
  cluster_name     = var.cluster_name
  cluster_endpoint = var.cluster_endpoint
  machine_type     = "worker"
  machine_secrets  = talos_machine_secrets.this.machine_secrets
}

data "talos_client_configuration" "this" {
  count                = length(var.controllers)
  cluster_name         = var.cluster_name
  client_configuration = talos_machine_secrets.this.client_configuration
  endpoints            = var.controllers[*].ipaddress

}

resource "talos_machine_configuration_apply" "controlplane" {
  count                       = length(var.controllers)
  client_configuration        = talos_machine_secrets.this.client_configuration
  machine_configuration_input = data.talos_machine_configuration.controlplane.machine_configuration

  node = var.controllers[count.index].ipaddress
  config_patches = [
    templatefile("${path.module}/templates/configure-hostname.yaml.tmpl", {
      hostname = var.controllers[count.index].name
    }),
    templatefile("${path.module}/templates/configure-vip.yaml.tmpl", {
      endpoint_vip = var.endpoint_vip
    }),
  ]
}


resource "talos_machine_configuration_apply" "worker" {
  client_configuration        = talos_machine_secrets.this.client_configuration
  machine_configuration_input = data.talos_machine_configuration.worker.machine_configuration
  count                       = length(var.workers)
  node                        = var.workers[count.index].ipaddress
  config_patches = [
    templatefile("${path.module}/templates/configure-hostname.yaml.tmpl", {
      hostname = var.workers[count.index].name
    })
  ]
}

resource "talos_machine_bootstrap" "this" {
  node                 = local.controller
  client_configuration = talos_machine_secrets.this.client_configuration
  depends_on           = [talos_machine_configuration_apply.controlplane]
}

data "talos_cluster_kubeconfig" "this" {
  client_configuration = talos_machine_secrets.this.client_configuration
  node                 = local.controller
  depends_on           = [talos_machine_bootstrap.this]
}
