import React, { useState } from "react";
import { useUser } from "../../contexts/UserContext";

const LoginPanel: React.FC = () => {
    const { login } = useUser();
    const [name, setName] = useState<string>('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        login(name);
    }

    return(
        <form onSubmit={handleLogin}>
            <h2>Hello</h2>
            <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Name"
            />
            <br />
            <button type="submit">Login</button>
        </form>
    );
};

export default LoginPanel;