import React, { useState, useEffect } from 'react';

const localFacts = [
    "Дерева спілкуються одне з одним через підземну мережу грибів, своєрідний 'лісовий інтернет'.",
    "Одне доросле дерево за рік здатне виробити стільки кисню, скільки потрібно для дихання двом людям.",
    "Найбільший живий організм на Землі – це грибниця опенька в штаті Орегон, яка займає площу 8.9 км².",
    "Бамбук – це трава, і деякі його види можуть виростати на 90 см за один день.",
    "Мурахи здатні підіймати вагу, що у 50 разів перевищує їхню власну.",
    "Дельфіни кличуть одне одного на 'ім’я', використовуючи унікальні звуки-свисти.",
    "Коала має відбитки пальців, які майже не відрізнити від людських під мікроскопом.",
    "Морські видри тримаються за лапки уві сні, щоб їх не розлучила течія.",
    "Слони — єдині ссавці, які не вміють стрибати.",
    "Понад 80% світового океану досі не досліджено і не нанесено на карти.",
    "Восьминіг має три серця: два перекачують кров до зябер, а одне — до всього тіла.",
    "Шимпанзе діляться їжею зі своїми родичами, проявляючи турботу.",
    "Кити можуть наспівувати власні мелодії, які чутно на тисячі кілометрів під водою.",
    "Найстарішому відомому дереву на Землі (сосна Мафусаїл) понад 4800 років.",
    "Бджоли використовують спеціальний танець, щоб показати вулика напрямок до нектару.",
    "Птахи орієнтуються під час міграції завдяки магнітному полю Землі.",
    "Дрібна медуза Turritopsis dohrnii вважається біологічно безсмертною.",
    "Ліси Амазонії виробляють близько 20% світового кисню.",
    "Павутина у 5 разів міцніша за сталь такої ж товщини і у 2 рази еластичніша за нейлон.",
    "На Землі існує понад 390 000 видів рослин, і нові відкривають ледь не щотижня."
];

const NatureFactWidget = () => {
    const [fact, setFact] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [fadeKey, setFadeKey] = useState(0);

    const loadFact = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch('https://uselessfacts.jsph.pl/random.json?language=en');
            if (res.ok) {
                const data = await res.json();
                // Simple heuristic to check if it's nature/science related (just an example).
                // Or simply always use the text directly. If it fails our nature check, use fallback.
                const text = data.text.toLowerCase();
                const isNatureRelated = ["tree", "animal", "earth", "water", "bird", "forest", "nature", "science"].some(word => text.includes(word));
                
                if (isNatureRelated) setFact(`🌎 ${data.text}`);
                else getRandomLocalFact();
            } else {
                getRandomLocalFact();
            }
        } catch (error) {
            getRandomLocalFact();
        } finally {
            // Stop rotation animation after 0.5s to assure visual loop
            setTimeout(() => setIsRefreshing(false), 500); 
            setFadeKey(prev => prev + 1); // Trigger React re-render of animation
        }
    };

    const getRandomLocalFact = () => {
        const randomIndex = Math.floor(Math.random() * localFacts.length);
        setFact(localFacts[randomIndex]);
    };

    useEffect(() => {
        loadFact();
    }, []);

    return (
        <div 
            className="nature-fact-widget"
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                width: '320px',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                padding: '15px 20px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                color: 'white',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    🌿 Факт про природу
                </h4>
                <button 
                    onClick={loadFact} 
                    title="Оновити факт"
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        transform: isRefreshing ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.5s ease-in-out',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                    </svg>
                </button>
            </div>
            
            <p key={fadeKey} style={{
                margin: 0, fontSize: '0.85rem', lineHeight: '1.4', 
                color: '#e2e8f0',
                animation: 'fadeIn 0.5s ease forwards'
            }}>
                {fact || "Завантаження..."}
            </p>

            <style jsx="true">{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @media (max-width: 600px) {
                    .nature-fact-widget {
                        width: auto !important;
                        left: 20px;
                        bottom: 20px;
                    }
                }
            `}</style>
        </div>
    );
};

export default NatureFactWidget;
