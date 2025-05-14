// API ключи (в реальном проекте их нужно скрыть)
const API_KEYS = {
    openweather: 'ваш_api_ключ',
    weatherapi: 'ваш_api_ключ',
    visualcrossing: 'ваш_api_ключ'
};

// Эндпоинты API
const API_URLS = {
    openweather: `https://api.openweathermap.org/data/2.5/weather?q=Chelyabinsk&units=metric&appid=${API_KEYS.openweather}&lang=ru`,
    weatherapi: `http://api.weatherapi.com/v1/current.json?key=${API_KEYS.weatherapi}&q=Chelyabinsk&lang=ru`,
    visualcrossing: `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/Chelyabinsk?unitGroup=metric&key=${API_KEYS.visualcrossing}&lang=ru`
};

// Получаем данные погоды
async function fetchWeather() {
    const weatherData = {};
    
    try {
        // Получаем данные со всех API
        const responses = await Promise.allSettled([
            fetch(API_URLS.openweather).then(res => res.json()),
            fetch(API_URLS.weatherapi).then(res => res.json()),
            fetch(API_URLS.visualcrossing).then(res => res.json())
        ]);
        
        // Обрабатываем OpenWeather
        if (responses[0].status === 'fulfilled') {
            const data = responses[0].value;
            weatherData.openweather = {
                temp: data.main.temp,
                feels_like: data.main.feels_like,
                humidity: data.main.humidity,
                wind: data.wind.speed,
                description: data.weather[0].description,
                pressure: data.main.pressure
            };
        }
        
        // Обрабатываем WeatherAPI
        if (responses[1].status === 'fulfilled') {
            const data = responses[1].value;
            weatherData.weatherapi = {
                temp: data.current.temp_c,
                feels_like: data.current.feelslike_c,
                humidity: data.current.humidity,
                wind: data.current.wind_kph / 3.6, // конвертируем в м/с
                description: data.current.condition.text,
                pressure: data.current.pressure_mb
            };
        }
        
        // Обрабатываем VisualCrossing
        if (responses[2].status === 'fulfilled') {
            const data = responses[2].value;
            weatherData.visualcrossing = {
                temp: data.currentConditions.temp,
                feels_like: data.currentConditions.feelslike,
                humidity: data.currentConditions.humidity,
                wind: data.currentConditions.windspeed,
                description: data.currentConditions.conditions,
                pressure: data.currentConditions.pressure / 1.333 // конвертируем в гПа
            };
        }
        
        // Рассчитываем средние значения
        if (Object.keys(weatherData).length > 0) {
            calculateAverage(weatherData);
        } else {
            throw new Error('Не удалось получить данные ни с одного сервиса');
        }
        
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
        document.getElementById('avg-temp').textContent = 'Ошибка';
        document.getElementById('avg-details').textContent = 'Не удалось загрузить данные о погоде';
    }
}

// Рассчет средних значений
function calculateAverage(weatherData) {
    const sources = Object.keys(weatherData);
    const avg = {
        temp: 0,
        feels_like: 0,
        humidity: 0,
        wind: 0,
        pressure: 0
    };
    
    // Суммируем значения
    sources.forEach(source => {
        avg.temp += weatherData[source].temp;
        avg.feels_like += weatherData[source].feels_like;
        avg.humidity += weatherData[source].humidity;
        avg.wind += weatherData[source].wind;
        avg.pressure += weatherData[source].pressure;
    });
    
    // Делим на количество источников
    sources.forEach(key => {
        avg[key] = avg[key] / sources.length;
    });
    
    // Отображаем средние значения
    document.getElementById('avg-temp').textContent = `${avg.temp.toFixed(1)}°C`;
    document.getElementById('avg-details').innerHTML = `
        Ощущается как: ${avg.feels_like.toFixed(1)}°C<br>
        Влажность: ${avg.humidity.toFixed(0)}%<br>
        Ветер: ${avg.wind.toFixed(1)} м/с<br>
        Давление: ${avg.pressure.toFixed(0)} гПа
    `;
    
    // Сохраняем данные для отображения по источникам
    window.weatherData = weatherData;
}

// Показываем данные по выбранному источнику
function showSourceData(source) {
    const data = window.weatherData[source];
    const sourceName = {
        openweather: 'OpenWeather',
        weatherapi: 'WeatherAPI',
        visualcrossing: 'VisualCrossing'
    }[source];
    
    if (data) {
        document.getElementById('source-weather').innerHTML = `
            <h3>${sourceName}</h3>
            <p>Температура: ${data.temp}°C</p>
            <p>Ощущается как: ${data.feels_like}°C</p>
            <p>Влажность: ${data.humidity}%</p>
            <p>Ветер: ${data.wind.toFixed(1)} м/с</p>
            <p>Давление: ${data.pressure.toFixed(0)} гПа</p>
            <p>Описание: ${data.description}</p>
        `;
    } else {
        document.getElementById('source-weather').innerHTML = `
            <p>Данные от ${sourceName} недоступны</p>
        `;
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    fetchWeather();
    
    // Обработчики для кнопок
    document.querySelectorAll('.source-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            showSourceData(btn.dataset.source);
        });
    });
});
