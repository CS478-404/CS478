import { useState, useEffect } from "react";
import axios from "axios";

function CreateRecipe() {
    let [username, setUsername] = useState("");
    let [error, setError] = useState<string | null>(null);

    let handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError(null);
            //await axios.post('/api/recipes', { name: username });
            alert(`Recipe "${username}" created!`); 
        } catch (err) {
            console.error(err);
            setError("Failed to create recipe");
        }
    };

    
    return (
        <>
                <h1>Create Recipe</h1>
        </>
    )
};

export default CreateRecipe;