locals {
  nameserver    = join(" ", var.proxmox.dns)
  search_domain = join(" ", var.proxmox.search_domains)
  controllers = concat(
    [for a in range(var.controllers.a_quantity) : "${var.controllers.name_prefix}-${a + 1}a"],
    [for b in range(var.controllers.b_quantity) : "${var.controllers.name_prefix}-${b + 1}b"]
  )
  workers = concat(
    [for a in range(var.workers.a_quantity) : "${var.workers.name_prefix}-${a + 1}a"],
    [for b in range(var.workers.b_quantity) : "${var.workers.name_prefix}-${b + 1}b"]
  )
}

module "controller" {
  source        = "./modules/proxmox-template/"
  for_each      = toset(local.controllers)
  name          = each.key
  description   = "Talos controller node ${each.key}"
  hostnumber    = index(local.controllers, each.key)
  gateway       = var.proxmox.gateway
  subnet        = var.proxmox.subnet
  start_address = var.controllers.start_address
  ram           = var.controllers.ram_gb
  cores         = var.controllers.cores
  target_node   = var.proxmox.target_node
  storage       = var.proxmox.storage
  nameserver    = local.nameserver
  search_domain = local.search_domain
}

module "worker" {
  source        = "./modules/proxmox-template/"
  for_each      = toset(local.workers)
  name          = each.key
  description   = "Talos worker node ${each.key}"
  hostnumber    = index(local.workers, each.key) + 1
  gateway       = var.proxmox.gateway
  subnet        = var.proxmox.subnet
  start_address = var.workers.start_address
  ram           = var.workers.ram_gb
  cores         = var.workers.cores
  target_node   = var.proxmox.target_node
  storage       = var.proxmox.storage
  nameserver    = local.nameserver
  search_domain = local.search_domain
  depends_on    = [module.controller]
}


module "talos" {
  source           = "./modules/talos"
  cluster_name     = var.cluster.name
  cluster_endpoint = var.cluster.endpoint
  controllers = [for key, value in module.controller : {
    name      = key
    ipaddress = value.ipaddress
  }]
  workers = [for key, value in module.worker : {
    name      = key
    ipaddress = value.ipaddress
  }]
  endpoint_vip = var.cluster.endpoint_vip
  depends_on   = [module.controller, module.worker]
}

resource "local_file" "kubeconfig" {
  depends_on = [module.talos]
  content    = module.talos.kubeconfig.kubeconfig_raw
  filename   = pathexpand("~/.kube/config")
}

resource "local_file" "talosconfig" {
  depends_on = [module.talos]
  content    = module.talos.client_configuration.talos_config
  filename   = pathexpand("~/.talos/config")
}
