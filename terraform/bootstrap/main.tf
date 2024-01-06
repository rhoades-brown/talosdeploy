module "sealed-secrets" {
  source = "./modules/sealed-secrets"
}

module "argocd" {
  source          = "./modules/argocd"
  depends_on      = [module.sealed-secrets]
  sealed_password = var.argocd.sealed_password
  sealed_type     = var.argocd.sealed_type
  sealed_url      = var.argocd.sealed_url
  sealed_username = var.argocd.sealed_username
}
