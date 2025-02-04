import { createContext, useContext, useState, ReactNode } from 'react';

interface CardContextType {
  loadingDialogShow: boolean;
  fireLoadingDialog: () => void;
  closeLoadingDialog: () => void;
}

const CardContext = createContext<CardContextType | undefined>(undefined);

export const CardProvider = ({ children }: { children: ReactNode }) => {
  const [loadingDialogShow, setLoadingDialogShow] = useState(false);

  const fireLoadingDialog = () => {
    setLoadingDialogShow(true);
  };

  const closeLoadingDialog = () => {
    setLoadingDialogShow(false);
  };

  return (
    <CardContext.Provider
      value={{
        loadingDialogShow,
        fireLoadingDialog,
        closeLoadingDialog,
      }}
    >
      {children}
    </CardContext.Provider>
  );
};

export const useCard = () => {
  const context = useContext(CardContext);
  if (context === undefined) {
    throw new Error('useCard must be used within a CardProvider');
  }
  return context;
};
