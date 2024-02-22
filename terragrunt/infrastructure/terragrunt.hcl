locals {
  common_vars = yamldecode(file(find_in_parent_folders("configuration.yaml")))
}

inputs = {
  controllers = local.common_vars["controllers"]
  workers     = local.common_vars["workers"]
  proxmox     = local.common_vars["proxmox"]
  cluster     = local.common_vars["cluster"]
}

terraform {
  source = "../../terraform/infrastructure"
}
