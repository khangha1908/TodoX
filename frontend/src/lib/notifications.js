// Notification utility functions for browser notifications

/**
 * Request permission for browser notifications
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

/**
 * Show a notification for an urgent task
 * @param {Object} task - The task object
 */
export const showTaskNotification = (task) => {
  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted');
    return;
  }

  const options = {
    body: `Task due soon: ${task.title}`,
    icon: '/vite.svg', // You can replace with your app icon
    badge: '/vite.svg',
    tag: `task-${task._id}`, // Prevents duplicate notifications for same task
    requireInteraction: false,
    silent: false
  };

  const notification = new Notification('Task Reminder', options);

  // Auto-close after 5 seconds
  setTimeout(() => {
    notification.close();
  }, 5000);

  // Handle click to focus window
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
};

/**
 * Check if notifications are supported and permitted
 */
export const areNotificationsSupported = () => {
  return 'Notification' in window && Notification.permission === 'granted';
};
