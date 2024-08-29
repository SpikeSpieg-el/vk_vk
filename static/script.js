document.addEventListener('DOMContentLoaded', () => {
    let userId = null;
    let counter = 0;
    let score = 0;

    // Инициализация VK Bridge
    vkBridge.send("VKWebAppInit", {})
        .then(() => {
            console.log('VK Bridge инициализирован');

            // Получение информации о пользователе
            vkBridge.send('VKWebAppGetUserInfo')
                .then((userInfo) => {
                    userId = userInfo.id;
                    console.log('User ID:', userId);

                    // Инициализация данных пользователя
                    if (userId) {
                        fetchUserData(userId);
                    } else {
                        console.error('Не удалось получить идентификатор пользователя');
                    }

                    // Показать слайды онбординга
                    showOnboardingSlides();
                })
                .catch((error) => {
                    console.error('Ошибка получения информации о пользователе:', error);
                });
        })
        .catch((error) => {
            console.error('Ошибка инициализации VK Bridge:', error);
        });

    const currentBackground = localStorage.getItem('selectedBackground') || '';
    const savedBgColor = localStorage.getItem('bgColor') || '#0077ff';
    const savedTextColor = localStorage.getItem('textColor') || '#ffffff';
    const savedBorderRadius = localStorage.getItem('borderRadius') || '10';

    const button = document.getElementById('clicker');
    const counterDisplay = document.getElementById('counter');
    const backgroundsContainer = document.getElementById('backgrounds');
    const menu = document.getElementById('menu');
    const menuToggle = document.getElementById('menuToggle');
    const inviteButton = document.getElementById('inviteButton');
    const showLeaderboardButton = document.getElementById('showLeaderboard');
    const showGlobalLeaderboardButton = document.getElementById('showGlobalLeaderboard');
    const globalLeaderboardModal = document.getElementById('globalLeaderboardModal');
    const closeModal = document.getElementById('closeModal');
    const leaderboardList = document.getElementById('leaderboardList');

    if (!button || !counterDisplay || !backgroundsContainer || !menu || !menuToggle || !inviteButton || !showLeaderboardButton || !showGlobalLeaderboardButton || !globalLeaderboardModal || !closeModal || !leaderboardList) {
        console.error('Один или несколько элементов не найдены в DOM');
        return;
    }

    if (currentBackground) {
        document.body.style.backgroundImage = `url(${currentBackground})`;
    }
    button.style.backgroundColor = savedBgColor;
    button.style.color = savedTextColor;
    button.style.borderRadius = savedBorderRadius + 'px';

    const backgrounds = [
        { url: 'static/images/00035-1729589691.png', requiredClicks: 0 },
        { url: 'static/images/00028-3886952918.png', requiredClicks: 1000 },
        { url: 'static/images/00037-4027474390.png', requiredClicks: 1500 }
    ];

    function renderBackgrounds() {
        backgroundsContainer.innerHTML = ''; 
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

    function fetchUserData(userId) {
        if (!userId) {
            console.error('User ID не определен');
            return;
        }

        fetch(`/getUserData?user_id=${userId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Сервер вернул ошибку: ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                counter = data.clicks || 0;
                score = data.score || 0;
                counterDisplay.textContent = counter;
                renderBackgrounds();
            })
            .catch((error) => {
                console.error('Ошибка получения данных пользователя:', error);
            });
    }

    function updateUserData(userId, clicks, score) {
        if (!userId) {
            console.error('User ID не определен');
            return;
        }

        fetch('/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: userId, clicks: clicks, score: score })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Данные успешно обновлены на сервере');
            } else {
                console.error('Ошибка обновления данных на сервере');
            }
        })
        .catch((error) => {
            console.error('Ошибка отправки данных на сервер:', error);
        });
    }

    button.addEventListener('click', () => {
        if (!userId) {
            console.error('User ID не определен');
            return;
        }

        counter++;
        counterDisplay.textContent = counter;
        renderBackgrounds();

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

        if (counter % 100 === 0) {
            score += 1;
        }

        // Обновление данных на сервере
        updateUserData(userId, counter, score);
    });

    showLeaderboardButton.addEventListener('click', () => {
        if (!userId) {
            console.error('User ID не определен');
            return;
        }

        vkBridge.send('VKWebAppShowLeaderBoardBox', {
            user_result: score // Показываем текущий результат пользователя
        })
        .then((data) => {
            if (data.success) {
                console.log('Таблица лидеров успешно показана');
            }
        })
        .catch((error) => {
            console.error('Ошибка показа таблицы лидеров:', error);
        });
    });

    showGlobalLeaderboardButton.addEventListener('click', () => {
        fetch('/globalLeaderboard')
            .then(response => response.json())
            .then(data => {
                // Фильтрация игроков с ID, содержащими 9 знаков
                const filteredData = data.filter(user => user.id.toString().length === 9);

                // Очистка списка перед добавлением новых данных
                leaderboardList.innerHTML = '';

                // Добавление отфильтрованных данных в список
                filteredData.forEach(user => {
                    const li = document.createElement('li');
                    li.textContent = `ID: ${user.id}, Очки: ${user.score}`;
                    leaderboardList.appendChild(li);
                });

                globalLeaderboardModal.style.display = 'block';
            })
            .catch(error => {
                console.error('Ошибка получения данных глобального рейтинга:', error);
            });
    });

    closeModal.addEventListener('click', () => {
        globalLeaderboardModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === globalLeaderboardModal) {
            globalLeaderboardModal.style.display = 'none';
        }
    });

    inviteButton.addEventListener('click', () => {
        vkBridge.send('VKWebAppShowInviteBox', {
            requestKey: 'key-12345'
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

    menuToggle.addEventListener('click', () => {
        menu.classList.toggle('open');
    });

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

    vkBridge.subscribe((event) => {
        if (event.detail.type === 'VKWebAppShowSlidesSheetResult') {
            console.log('Слайды успешно показаны, действие:', event.detail.data.action);
        } else if (event.detail.type === 'VKWebAppShowSlidesSheetFailed') {
            console.error('Ошибка при показе слайдов:', event.detail.data);
        }
    });

    function showOnboardingSlides() {
        vkBridge.send('VKWebAppShowSlidesSheet', {
            slides: [
                {
                    media: {
                        type: 'image'
                    },
                    title: 'Кликните на кнопку',
                    subtitle: 'Нажимайте на кнопку, чтобы увеличить счётчик.'
                },
                {
                    media: {
                        type: 'image'
                    },
                    title: 'Получайте баллы',
                    subtitle: 'За каждые 100 кликов вы получаете 1 балл.'
                },
                {
                    media: {
                        type: 'image'
                    },
                    title: 'Соревнуйтесь с друзьями',
                    subtitle: 'Соревнуйтесь с друзьями и достигайте новых рекордов!'
                }
            ]
        })
        .then((data) => { 
            if (data.result) {
                console.log('Слайды показаны');
            }
        })
        .catch((error) => {
            console.error('Ошибка показа слайдов:', error);
            if (error && error.error_data) {
                console.error('Код ошибки:', error.error_data.error_code);
                console.error('Описание ошибки:', error.error_data.error_reason);
            }
        });
    }
});
