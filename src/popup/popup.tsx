import React from "react";
import ReactDOM from "react-dom/client";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink, navigationMenuTriggerStyle } from '@/popup/components/ui/navigation-menu';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router';
import { Toaster } from '@/popup/components/ui/sonner';
import "./popup.css";
import Job from './pages/Job';
import UserProfile from './pages/userProfile';
import Settings from './pages/settings';
import Tasks from "./pages/tasks";
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { browserStorageService } from '@/infra/storage';

function NavBar() {
    return <NavigationMenu>
        <NavigationMenuList className="flex-wrap w-md h-12">
            <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <NavLink to="/user">User</NavLink>
                </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <NavLink to="/job">Job</NavLink>
                </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <NavLink to="/tasks">Tasks</NavLink>
                </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <NavLink to="/settings">Settings</NavLink>
                </NavigationMenuLink>
            </NavigationMenuItem>
        </NavigationMenuList>
    </NavigationMenu>;
}


function RedirectLogic() {
    const navigate = useNavigate();
    const location = useLocation();
    useEffect(() => {
        (async () => {
            if (location.pathname === '/' || location.pathname === '/src/popup/popup.html') {
                const config = await browserStorageService.loadLLMSettings();
                if (!config) {
                    navigate('/settings', { replace: true });
                    return;
                }
                const profile = await browserStorageService.loadProfile();
                if (!profile) {
                    navigate('/user', { replace: true });
                    return;
                }
                console.log("redirect to /job");
                navigate('/job');
            }
        })();
    }, []);

    return null;
}


export default function Popup() {
    return (
        <BrowserRouter>
            <NavBar />
            <Routes>
                <Route path="/user" element={<UserProfile />} />
                <Route path="/job" element={<Job />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<RedirectLogic />} />
            </Routes>
            <Toaster richColors />
        </BrowserRouter>
    );
}

ReactDOM.createRoot(document.body).render(
    <React.StrictMode>
        <Popup />
    </React.StrictMode>
);
