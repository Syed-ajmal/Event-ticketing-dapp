import { RouterProvider } from "react-router";
import { router } from "./app.routes";
import { AuthProvider } from "./features/auth/auth.context";
import { WalletProvider } from "./features/wallet/context/wallet.context";
import { EventProvider } from "./features/event/event.context.jsx";


const App = () => {
  return (
    <AuthProvider>
      <WalletProvider>
        <EventProvider>
          <RouterProvider router={router} />
        </EventProvider>
      </WalletProvider>
    </AuthProvider>
  );
};

export default App;
