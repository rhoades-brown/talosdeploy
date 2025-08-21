#!/bin/sh
# Install nala because it is fast and cool
sudo apt update
sudo apt install nala -y
sudo nala --install-completion bash
# Install pre-requisites
sudo nala update
sudo nala upgrade -y
sudo nala install apt-transport-https ca-certificates curl gpg fzf build-essential procps file git -y

/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
brew install terragrunt terraform kubectx k9s kubeseal tflint
brew tap siderolabs/talos
brew install talosctl
while ! grep -q HOMEBREW_PREFIX ~/.bashrc; do
cat <<EOT >>  ~/.bashrc
eval \"\$($(brew --prefix)/bin/brew shellenv)\""
HOMEBREW_PREFIX="\$(brew --prefix)"
if [[ -r "\${HOMEBREW_PREFIX}/etc/profile.d/bash_completion.sh" ]]
then
    source "\${HOMEBREW_PREFIX}/etc/profile.d/bash_completion.sh"
else
    for COMPLETION in "\${HOMEBREW_PREFIX}/etc/bash_completion.d/"*
    do
    [[ -r "\${COMPLETION}" ]] && source "\${COMPLETION}"
    done
fi
fi
EOT
done

source ~/.bashrc
