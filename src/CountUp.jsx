import React, { useEffect, useState } from 'react';

export const CountUp = ({ end, duration = 1000, suffix = "" }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        // Si c'est un petit chiffre, on va vite, sinon on prend le temps
        const incrementTime = (duration / end) * Math.abs(end);

        let timer = setInterval(() => {
            start += Math.ceil(end / 20); // Incrément par pas
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(start);
            }
        }, 30);

        return () => clearInterval(timer);
    }, [end, duration]);

    return <span>{count.toLocaleString()}{suffix}</span>;
};
