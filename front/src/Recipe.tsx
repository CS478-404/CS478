import {useNavigate, useParams} from 'react-router-dom';
import axios from 'axios';
import { useState, useEffect } from 'react';
import {Alert, Breadcrumbs, Container, IconButton, Link, Typography} from '@mui/material';
import { Star, StarBorder, StarHalf } from '@mui/icons-material';
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
    let [rating, setRating] = useState<number | null>(null);
    let [ratingCount, setRatingCount] = useState<number>(0);
    let [userRating, setUserRating] = useState<number | null>(null);
    let navigate = useNavigate();

    const submitRating = async (value: number) => {
        setError(null);
        try {
            const response = await axios.post(`/api/recipe/${id}/rating`, { rating: value });
            if (!response.data.ok) {
                if (response.data.error) {
                    setError(response.data.error);
                } else {
                    setError("Failed to submit rating");
                }
                return;
            }
            setUserRating(value);
            
            let ratingResponse = (await axios.get(`/api/recipe/${id}/rating`)).data;
            setRating(ratingResponse.rating);
            setRatingCount(ratingResponse.amount);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.error || "Failed to submit rating");
            } else {
                setError("Failed to submit rating");
            }
        }
    };

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

                let ratingResponse = (await axios.get(`/api/recipe/${id}/rating`)).data;
                setRating(ratingResponse.rating);
                setRatingCount(ratingResponse.amount);

                let userRatingResponse = (await axios.get(`/api/recipe/${id}/user-rating`)).data;
                setUserRating(userRatingResponse.rating);
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
        let lines = instructions
            .split(/\r\n|\r|\n/)
            .map(line => line.trim())
            .filter(line =>
                line.length > 0 &&
                !/^(step\s*\d+|\d+\.)$/i.test(line)
            );

        let combined: string[] = [];
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].endsWith(':') && i + 1 < lines.length) {
                combined.push(lines[i] + ' ' + lines[i + 1]);
                i++;
            } else {
                combined.push(lines[i]);
            }
        }
        return combined;
    };
    
    let instructions = parseInstructions(recipe?.strInstructions || '');
    let tags = recipe?.strTags ? recipe.strTags.split(',').map(tag => tag.trim()) : [];

    let addToFavorites = async (recipeId: number) => {
        try {
            await axios.post(`/api/favorites`, { data: { recipeId } });
        } catch (error) {
            console.error("Error adding to favorites:", error);
        }
    };

    let removeFromFavorites = async (recipeId: number) => {
        try {
            await axios.delete(`/api/favorites`, { data: { recipeId } });
        } catch (error) {
            console.error("Error removing from favorites:", error);
        }
    }

    let toggleFavorite = () => {
        setIsFavorite(!isFavorite);
        if (!isFavorite) {
            addToFavorites(recipe!.id);
        } else {
            removeFromFavorites(recipe!.id);
        }
    };


    return (
        <>
            <div className="recipe-page">
                <div className="errorHandler">
                    {error && (
                        <div className="alert-container">
                            <Alert severity="error">{error}</Alert>
                        </div>
                    )}
                    {!loading && !recipe && !error && <Container maxWidth="md" sx={{ py: 1 }}>
                        <Alert severity="info">Recipe not found.</Alert>
                    </Container>}
                    {loading && <Container maxWidth="md" sx={{ py: 1 }}>
                        <Alert severity="info">Loading recipe...</Alert>
                    </Container>}
                </div>
                {recipe && (
                    <>
                        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
                            <Link
                                underline="hover"
                                color="inherit"
                                onClick={() => navigate("/")}
                                sx={{ cursor: "pointer" }}
                            >
                                Home
                            </Link>
                            <Typography color="text.primary">{recipe.strMeal}</Typography>
                        </Breadcrumbs>
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
                                <div className="recipe-rating" style={{
                                    marginBottom: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    minHeight: '32px',
                                    justifyContent: 'flex-start'
                                }}>
                                    {typeof rating === "number" && !isNaN(rating) && ratingCount && ratingCount > 0 ? (
                                        <>
                                            {(() => {
                                                const rounded = Math.round(rating * 2) / 2;
                                                return [1,2,3,4,5].map((star) => {
                                                    if (star <= Math.floor(rounded)) {
                                                        return <Star key={star} sx={{ color: '#ffd700', fontSize: '1.5rem' }} />;
                                                    } else if (star === Math.ceil(rounded) && rounded % 1 === 0.5) {
                                                        return <StarHalf key={star} sx={{ color: '#ffd700', fontSize: '1.5rem' }} />;
                                                    } else {
                                                        return <StarBorder key={star} sx={{ color: '#646cff', fontSize: '1.5rem' }} />;
                                                    }
                                                });
                                            })()}
                                            <span style={{ marginLeft: 8, fontWeight: 500 }}>
                                                {rating.toFixed(1)} ({ratingCount})
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            {[1,2,3,4,5].map((star) =>
                                                <StarBorder key={star} sx={{ color: '#bbb', fontSize: '1.5rem' }} />
                                            )}
                                            <span style={{ marginLeft: 8, color: '#888', fontWeight: 500 }}>(unrated)</span>
                                        </>
                                    )}
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
                        <div className="rating-section">
                            <span style={{ marginRight: 8 }}>Your Rating:</span>
                            {[1,2,3,4,5].map((star) =>
                                <IconButton
                                    key={star}
                                    onClick={() => submitRating(star)}
                                    disabled={loading}
                                    sx={{ padding: 0 }}
                                >
                                    {userRating && star <= userRating
                                        ? <Star sx={{ color: '#ffd700', fontSize: '1.5rem' }} />
                                        : <StarBorder sx={{ color: '#646cff', fontSize: '1.5rem' }} />}
                                </IconButton>
                            )}
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