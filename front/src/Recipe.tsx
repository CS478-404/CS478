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
    let [loading, setLoading] = useState(true);

    useEffect(() => {
        let fetchRecipe = async () => {
            try {
                setLoading(true);
                setError(null);
                
                let recipeResponse = (await axios.get(`/api/recipe/${id}`)).data;
                
                recipeResponse.ingredients = [];
                
                let ingredients = (await axios.get(`/api/recipe/${id}/ingredients`)).data;
                
                for (let ingredient of ingredients) {
                    let nameResponse = await axios.get(`/api/ingredient/${ingredient.idIngredient}`);
                    recipeResponse.ingredients.push({
                        name: nameResponse.data.name,
                        measure: ingredient.measure
                    });
                }
                
                setRecipe(recipeResponse);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch recipe");
            } finally {
                setLoading(false);
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
            <div className="errorHandler">
                {error && <Container maxWidth="md" sx={{ py: 1 }}>
                    <Alert severity="error">{error}</Alert>
                </Container>}
                {!loading && !recipe && !error && <Container maxWidth="md" sx={{ py: 1 }}>
                    <Alert severity="info">Recipe not found.</Alert>
                </Container>}
                {loading && <Container maxWidth="md" sx={{ py: 1 }}>
                    <Alert severity="info">Loading recipe...</Alert>
                </Container>}
            </div>
            {recipe && (
                <>
                    <div>
                        <img src={recipe.strMealThumb} alt={recipe.strMeal}></img>
                        <div className="details">
                            <h1>{recipe.strMeal}</h1>
                            <p><strong>Category:</strong> {recipe.strCategory}</p>
                            <p><strong>Area:</strong> {recipe.strArea}</p>
                            {tags.length > 0 && (
                                <p><strong>Tags:</strong> {tags.join(', ')}</p>
                            )}
                        </div>
                    </div>
                    <div className="instructions">
                        <h2>Instructions</h2>
                        <div className="steps">
                            {instructions.map((line, index) => (
                                <p key={index}>{line}</p>
                            ))}
                        </div>
                    </div>
                    {recipe.ingredients && recipe.ingredients.length > 0 && (
                        <div className="ingredients">
                            <h2>Ingredients</h2>
                            <ul>
                                {recipe.ingredients.map((ingredient, index) => (
                                    <li key={index}>
                                        {ingredient.measure} {ingredient.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="comments">
                        <p><strong>Comments:</strong></p>
                        <p>Comments section coming soon...</p>
                    </div>
                </>
            )}
        </div>
    );
}

export default Recipe;