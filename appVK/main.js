import bridge from '@vkontakte/vk-bridge';

// Инициализация VK Bridge
bridge.send('VKWebAppInit');

// Объявление переменных
let score = 0;

// Функция обновления очков
function updateScore() {
    score++;
    document.getElementById('score').textContent = score;
}

// Добавление обработчика нажатия на кнопку
document.getElementById('clicker-button').addEventListener('click', updateScore);
