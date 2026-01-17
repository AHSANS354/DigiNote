const fs = require('fs');

// Mapping Font Awesome to Feather Icons
const iconMap = {
  'fas fa-wallet': 'data-feather="credit-card"',
  'fas fa-sign-in-alt': 'data-feather="log-in"',
  'fas fa-user': 'data-feather="user"',
  'fas fa-lock': 'data-feather="lock"',
  'fas fa-user-plus': 'data-feather="user-plus"',
  'fas fa-envelope': 'data-feather="mail"',
  'fas fa-user-circle': 'data-feather="user"',
  'fas fa-sign-out-alt': 'data-feather="log-out"',
  'fas fa-arrow-up': 'data-feather="trending-up"',
  'fas fa-arrow-down': 'data-feather="trending-down"',
  'fas fa-plus-circle': 'data-feather="plus-circle"',
  'fas fa-cog': 'data-feather="settings"',
  'fas fa-plus': 'data-feather="plus"',
  'fas fa-history': 'data-feather="clock"',
  'fas fa-chart-pie': 'data-feather="pie-chart"',
  'fas fa-tags': 'data-feather="tag"',
  'fas fa-tag': 'data-feather="tag"',
  'fas fa-shopping-cart': 'data-feather="shopping-cart"',
  'fas fa-utensils': 'data-feather="coffee"',
  'fas fa-home': 'data-feather="home"',
  'fas fa-car': 'data-feather="car"',
  'fas fa-bus': 'data-feather="truck"',
  'fas fa-heart': 'data-feather="heart"',
  'fas fa-graduation-cap': 'data-feather="book"',
  'fas fa-briefcase': 'data-feather="briefcase"',
  'fas fa-gift': 'data-feather="gift"'
};

// Read HTML file
let html = fs.readFileSync('frontend/index.html', 'utf8');

// Replace all icons
Object.keys(iconMap).forEach(faIcon => {
  const featherIcon = iconMap[faIcon];
  const regex = new RegExp(`class="${faIcon}"`, 'g');
  html = html.replace(regex, featherIcon);
});

// Write back
fs.writeFileSync('frontend/index.html', html);

console.log('Icons replaced successfully!');