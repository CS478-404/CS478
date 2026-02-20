import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { Alert, Container } from '@mui/material';

interface Recipe {
    id: number;
    strMeal: string;
    strMealThumb: string;
    strInstructions: string;
    strCategory?: string;
    strArea?: string;
    strTags?: string;
    ingredients?: Array<{
        name: string;
        measure: string;
    }>;
}

function Recipe() {
    let { id } = useParams<{ id: string }>();
    let [recipe, setRecipe] = useState<Recipe | null>(null);
    let [error, setError] = useState<string | null>(null);

    useEffect(() => {

        let fetchRecipe = async () => {
            try {
                let response = await axios.get(`/api/recipe/${id}`);
                let ingredients = await axios.get(`/api/recipe/${id}/ingredients`).then(res => res.data);
                for (let ingredient of ingredients) {
                    let name =  await axios.get(`/api/ingredient/${ingredient.ingredientId}`).then(res => res.data.name);
                    response.data.ingredients.push({
                        name: name,
                        measure: ingredient.strMeasure
                    });
                }
                setRecipe(response.data);
                setError(null);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch recipe");
            }
        };

        if (id) {
            fetchRecipe();
        }
    }, [id]);

    let instructions = recipe?.strInstructions
        ? recipe.strInstructions.split(/\r\n|\r|\n/).filter(line => line.trim() !== '')
        : [];
    
    let tags = recipe?.strTags ? recipe.strTags.split(',').map(tag => tag.trim()) : [];

    return (
        <div className="recipe-page">
            
            <div>
                <img src={recipe?.strMealThumb} alt={recipe?.strMeal}></img>
                <div className="details">
                    <h1>{recipe?.strMeal}</h1>
                    <p><strong>Category:</strong> {recipe?.strCategory}</p>
                    <p><strong>Area:</strong> {recipe?.strArea}</p>
                    {tags.length > 0 && (
                        <p><strong>Tags:</strong> {tags.join(', ')}</p>
                    )}
                </div>
            </div>
            <div className="instructions">
                <div> 
                    
                </div>
                <div className="steps">
                    {instructions.map((line, index) => (
                        <p key={index}>{line}</p>
                    ))}
                </div>
            </div>
            <div className = "comments">
                <p><strong>Comments:</strong></p>
                <p>Comments section coming soon...</p>
            </div>
        </div>
    );
}

export default Recipe;