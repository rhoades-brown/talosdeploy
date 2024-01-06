/* Uses Cloud-Init options from Proxmox 5.2 */
resource "proxmox_vm_qemu" "this" {
  name                    = var.name
  desc                    = var.description
  target_node             = var.target_node
  cores                   = var.cores
  memory                  = var.ram * 1024
  clone                   = "talos-template"
  scsihw                  = "virtio-scsi-single"
  full_clone              = true
  tablet                  = false
  automatic_reboot        = true
  boot                    = "order=scsi0"
  qemu_os                 = "l26"
  os_type                 = "cloud-init"
  cloudinit_cdrom_storage = var.storage
  ipconfig0               = "ip=${local.ipaddress}/${local.subnet},gw=${var.gateway}"
  nameserver              = var.nameserver
  searchdomain            = var.search_domain

  network {
    model     = "virtio"
    bridge    = "vmbr0"
    firewall  = false
    link_down = false
  }

  #  disk {
  #    type     = "scsi"
  #    size     = "8G"
  #    storage  = var.storage
  #    iothread = 0
  #  }
}

locals {
  ipaddress = cidrhost(var.subnet, var.start_address + var.hostnumber)
  subnet    = element(split("/", var.subnet), 1)
}
