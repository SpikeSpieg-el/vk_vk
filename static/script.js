document.addEventListener('DOMContentLoaded', () => {
    // Инициализация VK Bridge
    vkBridge.send("VKWebAppInit", {})
        .then(() => {
            console.log('VK Bridge инициализирован');
        })
        .catch((error) => {
            console.error('Ошибка инициализации VK Bridge:', error);
        });

    // Получение сохранённых значений из localStorage
    let counter = parseInt(localStorage.getItem('clickCounter')) || 0;
    let score = parseInt(localStorage.getItem('userScore')) || 0;
    const currentBackground = localStorage.getItem('selectedBackground') || '';
    const savedBgColor = localStorage.getItem('bgColor') || '#0077ff';
    const savedTextColor = localStorage.getItem('textColor') || '#ffffff';
    const savedBorderRadius = localStorage.getItem('borderRadius') || '10';

    const button = document.getElementById('clicker');
    const counterDisplay = document.getElementById('counter');
    const backgroundsContainer = document.getElementById('backgrounds');
    const menu = document.getElementById('menu');
    const menuToggle = document.getElementById('menuToggle');
    const inviteButton = document.getElementById('inviteButton'); // Убедитесь, что этот элемент существует

    // Проверка наличия элементов перед их использованием
    if (!button || !counterDisplay || !backgroundsContainer || !menu || !menuToggle || !inviteButton) {
        console.error('Один или несколько элементов не найдены в DOM');
        return;
    }

    // Установка текущего фона и стилей кнопки
    if (currentBackground) {
        document.body.style.backgroundImage = `url(${currentBackground})`;
    }
    button.style.backgroundColor = savedBgColor;
    button.style.color = savedTextColor;
    button.style.borderRadius = savedBorderRadius + 'px';

    // Массив фонов и количество кликов для разблокировки
    const backgrounds = [
        { url: 'static/images/00035-1729589691.png', requiredClicks: 0 },
        { url: 'static/images/00028-3886952918.png', requiredClicks: 1000 },
        { url: 'static/images/00037-4027474390.png', requiredClicks: 1500 }
    ];

    // Функция отображения доступных фонов
    function renderBackgrounds() {
        backgroundsContainer.innerHTML = ''; // Очищаем контейнер
        backgrounds.forEach((bg) => {
            const bgElement = document.createElement('div');
            bgElement.className = 'background-item';
            bgElement.style.backgroundImage = `url(${bg.url})`;

            if (counter >= bg.requiredClicks) {
                bgElement.addEventListener('click', () => {
                    document.body.style.backgroundImage = `url(${bg.url})`;
                    localStorage.setItem('selectedBackground', bg.url);
                });
            } else {
                bgElement.classList.add('locked');
            }

            backgroundsContainer.appendChild(bgElement);
        });
    }

    // Отображение текущего значения счётчика
    counterDisplay.textContent = counter;

    button.addEventListener('click', () => {
        // Увеличение счётчика и его отображение
        counter++;
        counterDisplay.textContent = counter;

        // Сохранение нового значения счётчика в localStorage
        localStorage.setItem('clickCounter', counter);

        // Обновление списка доступных фонов
        renderBackgrounds();

        // Показывать рекламу каждые 1000 кликов
        if (counter % 1000 === 0) {
            vkBridge.send('VKWebAppShowBannerAd', {
                banner_location: 'bottom'
            })
            .then((data) => {
                if (data.result) {
                    console.log('Баннерная реклама отобразилась');
                }
            })
            .catch((error) => {
                console.error('Ошибка показа баннера:', error);
            });
        }

        // Обновляем очки пользователя
        if (counter % 100 === 0) {
            score += 1;
            localStorage.setItem('userScore', score);
        }
    });

   // Обработчик для показа таблицы лидеров
document.getElementById('showLeaderboard').addEventListener('click', () => {
    vkBridge.send('VKWebAppShowLeaderBoardBox', {
        user_result: score, // Текущий уровень или очки пользователя
        global: 0           // Локальная таблица среди друзей
    })
    .then((data) => {
        // Логируем полученные данные для отладки
        console.log('Ответ от VK Web App:', data);

        if (data.success) {
            console.log('Таблица лидеров успешно показана');
        } else {
            console.error('Ошибка при показе таблицы лидеров:', data);
        }
    })
    .catch((error) => {
        console.error('Ошибка при показе таблицы лидеров:', error);
    });
});


    // Обработчик для показа приглашения
    inviteButton.addEventListener('click', () => {
        vkBridge.send('VKWebAppShowInviteBox', {
            requestKey: 'key-12345' // Необязательный параметр
        })
        .then((data) => {
            if (data.success) {
                console.log('Приглашение выслано', data.notSentIds);
            }
        })
        .catch((e) => {
            let { error_code, error_reason } = e.error_data;
            if (error_code === 4 && error_reason === 'User denied') {
                console.log('Пользователь нажал «Отмена» в диалоге');
            } else {
                console.error('Ошибка:', e);
            }
        });
    });

    // Логика открытия/закрытия меню
    menuToggle.addEventListener('click', () => {
        menu.classList.toggle('open');
    });

    // Обработчики изменения стилей через меню
    document.getElementById('bgColor').addEventListener('input', (event) => {
        const color = event.target.value;
        button.style.backgroundColor = color;
        localStorage.setItem('bgColor', color);
    });

    document.getElementById('textColor').addEventListener('input', (event) => {
        const color = event.target.value;
        button.style.color = color;
        localStorage.setItem('textColor', color);
    });

    document.getElementById('borderRadius').addEventListener('input', (event) => {
        const radius = event.target.value;
        button.style.borderRadius = radius + 'px';
        localStorage.setItem('borderRadius', radius);
    });

    // Подписка на события
    vkBridge.subscribe((event) => {
        if (event.detail.type === 'VKWebAppShowLeaderBoardResult') {
            console.log('Таблица лидеров успешно показана');
        } else if (event.detail.type === 'VKWebAppShowLeaderBoardFailed') {
            console.error('Ошибка при показе таблицы лидеров:', event.detail.data);
        }
    });

    // Начальное отображение фонов
    renderBackgrounds();
});
