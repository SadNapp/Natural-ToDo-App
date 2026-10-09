import { useState } from 'react';

const facts = [
    'Дерева спілкуються між собою через підземні мережі грибниці.',
    'Бджоли можуть розпізнавати людські обличчя за візуальними ознаками.',
    'Восьминоги мають три серця та блакитну кров.',
    'Морські видри тримаються за лапки, щоб не віддалятися одна від одної.',
    'Один великий дуб може підтримувати життя сотень інших видів.',
    'Українські Карпати є домівкою для бурих ведмедів, рисей і чорних лелек.',
    'Медоносні бджоли повідомляють одна одній про їжу за допомогою танцю.',
];

function NatureFactWidget() {
    const [factIndex, setFactIndex] = useState(() => Math.floor(Math.random() * facts.length));
    const [isRefreshing, setIsRefreshing] = useState(false);
    const refresh = () => {
        setIsRefreshing(true);
        setFactIndex((current) => (current + 1 + Math.floor(Math.random() * (facts.length - 1))) % facts.length);
        window.setTimeout(() => setIsRefreshing(false), 500);
    };
    return <aside className="nature-fact-widget" aria-label="Цікавий факт про природу"><div className="fact-heading"><h2><span aria-hidden="true">✿</span> Маленьке диво природи</h2><button className={`fact-refresh ${isRefreshing ? 'refreshing' : ''}`} onClick={refresh} disabled={isRefreshing} aria-label="Оновити факт">↻</button></div><p>{facts[factIndex]}</p></aside>;
}

export default NatureFactWidget;
