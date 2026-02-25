import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { Alert, Container, IconButton } from '@mui/material';
import { Star, StarBorder } from '@mui/icons-material';
import './App.css';
import CommentSection from './CommentSection';

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
    let [isFavorite, setIsFavorite] = useState(false);

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

    let parseInstructions = (instructions: string) => {
        if (!instructions) return [];
        
        let lines = instructions.split(/\r\n|\r|\n/).filter(line => line.trim() !== '');
        let steps = [];
        
        for (let line of lines) {
            line = line.trim();
            
            let stepMatch = line.match(/^step\s*(\d+)/i);
            if (stepMatch) {
                let stepText = line.replace(/^step\s*\d+\s*/i, '').trim();
                if (stepText) {
                    steps.push(stepText);
                }
            } else if (line.length > 0) {
                if (steps.length === 0 || line.length > 50) {
                    steps.push(line);
                } else {
                    if (steps.length > 0) {
                        steps[steps.length - 1] += ' ' + line;
                    }
                }
            }
        }
        
        return steps;
    };
    
    let instructions = parseInstructions(recipe?.strInstructions || '');
    let tags = recipe?.strTags ? recipe.strTags.split(',').map(tag => tag.trim()) : [];
    let toggleFavorite = () => {
        setIsFavorite(!isFavorite);
    };

    return (
        <>
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
                        <div className="details">
                            <img src={recipe.strMealThumb} alt={recipe.strMeal}></img>
                            <div className="recipe-info">
                                <div className="recipe-header">
                                    <h1>{recipe.strMeal}</h1>
                                    <IconButton 
                                        onClick={toggleFavorite}
                                        className="favorite-button"
                                        aria-label="toggle favorite"
                                        sx={{ 
                                            '& .MuiTouchRipple-root': { display: 'none' },
                                            marginTop: '10px',
                                            marginLeft: '10px'
                                        }}
                                    >
                                        {isFavorite ? (
                                            <Star sx={{ color: '#ffd700', fontSize: '2rem' }} />
                                        ) : (
                                            <StarBorder sx={{ color: '#646cff', fontSize: '2rem' }} />
                                        )}
                                    </IconButton>
                                </div>
                                <p><strong>Category:</strong> {recipe.strCategory}</p>
                                <p><strong>Area:</strong> {recipe.strArea}</p>
                                {tags.length > 0 && (
                                    <p><strong>Tags:</strong> {tags.join(', ')}</p>
                                )}
                                {recipe.ingredients && recipe.ingredients.length > 0 && (
                                <div className="ingredients">
                                    <h2>Ingredients</h2>
                                    <ul className={recipe.ingredients.length > 10 ? 'two-columns' : ''}>
                                        {recipe.ingredients.map((ingredient, index) => (
                                            <li key={index}>
                                                {ingredient.measure} {ingredient.name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                )}
                            </div>
                        </div>
                        <div className="instructions">
                            <h2>Instructions</h2>
                            <div className="steps">
                                {instructions.map((step, index) => (
                                    <div key={index} className="step">
                                        <span className="step-number">{index + 1}.</span>
                                        <span className="step-text">{step}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="comments">
                            <CommentSection recipeId={recipe.id} />
                        </div>
</>
                )}
            </div>
        </>
    );
}

export default Recipe;