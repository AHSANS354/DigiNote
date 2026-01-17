const fs = require('fs');

let html = fs.readFileSync('frontend/index.html', 'utf8');

// Replace all data-feather and Font Awesome with emoji
const replacements = {
  '<i data-feather="credit-card"></i>': '💰',
  '<i data-feather="log-in"></i>': '🔑',
  '<i data-feather="user"></i>': '👤',
  '<i data-feather="lock"></i>': '🔒',
  '<i data-feather="user-plus"></i>': '👥',
  '<i data-feather="mail"></i>': '📧',
  '<i data-feather="log-out"></i>': '🚪',
  '<i data-feather="trending-up"></i>': '📈',
  '<i data-feather="trending-down"></i>': '📉',
  '<i data-feather="plus-circle"></i>': '➕',
  '<i data-feather="settings"></i>': '⚙️',
  '<i data-feather="plus"></i>': '➕',
  '<i data-feather="clock"></i>': '🕐',
  '<i data-feather="pie-chart"></i>': '📊',
  '<i data-feather="tag"></i>': '🏷️',
  '<i class="fas fa-gamepad"></i>': '🎮',
  '<i class="fas fa-mobile-alt"></i>': '📱',
  '<i class="fas fa-laptop"></i>': '💻',
  '<i class="fas fa-tshirt"></i>': '👕',
  '<i class="fas fa-dumbbell"></i>': '🏋️',
  '<i class="fas fa-pills"></i>': '💊',
  '<i class="fas fa-book"></i>': '📚',
  '<i class="fas fa-plane"></i>': '✈️'
};

// Apply all replacements
Object.keys(replacements).forEach(oldIcon => {
  const newIcon = replacements[oldIcon];
  html = html.replace(new RegExp(oldIcon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newIcon);
});

// Remove remaining Font Awesome references in icon grid
html = html.replace(/data-icon="fa-[^"]*"/g, 'data-icon="🎮"');

fs.writeFileSync('frontend/index.html', html);
console.log('All icons replaced with emoji!');