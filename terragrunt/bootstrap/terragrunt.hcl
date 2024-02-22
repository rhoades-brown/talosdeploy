locals {
  common_vars = yamldecode(file(find_in_parent_folders("configuration.yaml")))
}

dependencies {
  paths = ["../infrastructure"]
}

dependency "infrastructure" {
  config_path = "../infrastructure"

  # Configure mock outputs for the `validate` command that are returned when there are no outputs available (e.g the
  # module hasn't been applied yet.
  mock_outputs_allowed_terraform_commands = ["validate"]
  mock_outputs = {
    host                   = "mock_host"
    client_certificate     = "mock_client_certificate"
    client_key             = "mock_client_key"
    cluster_ca_certificate = "mock_cluster_ca_certificate"
  }
}

inputs = {
  host                   = dependency.infrastructure.outputs.host
  client_certificate     = dependency.infrastructure.outputs.client_certificate
  client_key             = dependency.infrastructure.outputs.client_key
  cluster_ca_certificate = dependency.infrastructure.outputs.cluster_ca_certificate
  argocd                 = local.common_vars["argocd"]
}

terraform {
  source = "../../terraform/bootstrap"
}
