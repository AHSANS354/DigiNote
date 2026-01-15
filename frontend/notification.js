// Custom Toast Notification System
const Toast = {
  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: '<i class="fas fa-check-circle"></i>',
      error: '<i class="fas fa-times-circle"></i>',
      warning: '<i class="fas fa-exclamation-triangle"></i>',
      info: '<i class="fas fa-info-circle"></i>'
    };
    
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  
  success(message, duration) {
    this.show(message, 'success', duration);
  },
  
  error(message, duration) {
    this.show(message, 'error', duration);
  },
  
  warning(message, duration) {
    this.show(message, 'warning', duration);
  },
  
  info(message, duration) {
    this.show(message, 'info', duration);
  }
};

// Custom Confirm Dialog
const Confirm = {
  show(options = {}) {
    return new Promise((resolve) => {
      const {
        title = 'Konfirmasi',
        message = 'Apakah Anda yakin?',
        icon = '❓',
        confirmText = 'Ya',
        cancelText = 'Batal',
        type = 'default' // default, danger
      } = options;
      
      const dialog = document.createElement('div');
      dialog.className = 'confirm-dialog';
      
      dialog.innerHTML = `
        <div class="confirm-dialog-content">
          <div class="confirm-dialog-icon">${icon}</div>
          <div class="confirm-dialog-title">${title}</div>
          <div class="confirm-dialog-message">${message}</div>
          <div class="confirm-dialog-buttons">
            <button class="confirm-btn-cancel">${cancelText}</button>
            <button class="confirm-btn-confirm ${type === 'danger' ? 'danger' : ''}">${confirmText}</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(dialog);
      
      const btnCancel = dialog.querySelector('.confirm-btn-cancel');
      const btnConfirm = dialog.querySelector('.confirm-btn-confirm');
      
      const cleanup = () => {
        dialog.style.animation = 'fadeOut 0.2s ease-out';
        setTimeout(() => dialog.remove(), 200);
      };
      
      btnCancel.onclick = () => {
        cleanup();
        resolve(false);
      };
      
      btnConfirm.onclick = () => {
        cleanup();
        resolve(true);
      };
      
      // Close on outside click
      dialog.onclick = (e) => {
        if (e.target === dialog) {
          cleanup();
          resolve(false);
        }
      };
    });
  },
  
  async delete(message = 'Data yang dihapus tidak dapat dikembalikan.') {
    return await this.show({
      title: 'Hapus Data?',
      message,
      icon: '<i class="fas fa-trash-alt" style="color: #ef4444;"></i>',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      type: 'danger'
    });
  }
};
