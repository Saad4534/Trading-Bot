import React, { createContext, useState } from 'react';

export const PnLContext = createContext();

export const PnLProvider = ({ children }) => {
    const [currentPnL, setCurrentPnL] = useState(0);
    const [netPnL, setNetPnL] = useState(0);

    return (
        <PnLContext.Provider value={{ currentPnL, setCurrentPnL, netPnL, setNetPnL }}>
            {children}
        </PnLContext.Provider>
    );
};
