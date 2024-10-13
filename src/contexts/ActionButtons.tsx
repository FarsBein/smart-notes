import { createContext, ReactNode, useContext, useState } from 'react';

interface ActionButtonsContextType {
    isSearchOpen: boolean;
    setIsSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ActionButtonsContext = createContext<ActionButtonsContextType>({
    isSearchOpen: false,
    setIsSearchOpen: () => {},
});

export const ActionButtonsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    
    return (
        <ActionButtonsContext.Provider value={{ isSearchOpen, setIsSearchOpen }}>
            {children}
        </ActionButtonsContext.Provider>
    );
};

export const useActionButtons = () => {
    return useContext(ActionButtonsContext);
};
