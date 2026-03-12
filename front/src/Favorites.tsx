import axios from 'axios';
import {useEffect, useState} from 'react';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import {useNavigate} from 'react-router-dom';
import Pagination from "@mui/material/Pagination";

type Meal = {
    id: string;
    strMealThumb: string;
    strTags: string;
    strCategory: string;
    strMeal: string;
};

function Favorites() {
    let [favorites, setFavorites] = useState<Meal[]>([]);
    let [error, setError] = useState<string | null>(null);
    let renderLimit = 24;
    const [page, setPage] = useState<number>(1);
    let visibleFavorites = favorites.slice(0, renderLimit);

    let navigate = useNavigate();

    useEffect (() => { 
        async function fetchFavorites() {
            let favs = await axios.get('/api/favorites');
            if (favs.status === 200) {
                setFavorites(favs.data);
            } else {
                setFavorites([]);
                setError("Failed to fetch favorites");
            }
        }
        fetchFavorites();
    }, []);


    return (
        <div style={{ width: "100%" }}>
            <div className="errorHandler">
                {error && (
                    <div className="alert-container">
                        <Alert severity="error">{error}</Alert>
                    </div>
                )}
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
            </div>
            <h1 style={{ marginTop: 0, marginBottom: 24 }}>
                My Favorites
            </h1>
            <Box sx={{ width: "100%" }}>
                <Grid container spacing={2} justifyContent="center">
                    {visibleFavorites.map((meal) => (
                        <Grid key={meal.id}>
                            <Card sx={{ width: 250, height: 300, cursor: "pointer" }} variant="outlined">
                                <CardActionArea onClick={() => navigate(`/recipe/${meal.id}`)}>
                                    <CardMedia
                                        component="img"
                                        sx={{ maxHeight: 200 }}
                                        image={meal.strMealThumb}
                                        alt={meal.strMeal}
                                        loading="lazy"
                                    />
                                    <CardContent>
                                        <Typography
                                            component="h1"
                                            color="textPrimary"
                                            sx={{
                                                fontSize: 25,
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                            }}
                                        >
                                            {meal.strMeal}
                                        </Typography>
                                        <Typography component="h4" color="textSecondary">
                                            {meal.strCategory}
                                        </Typography>
                                        <Typography component="p" variant="body2" color="textDisabled">
                                            {meal.strTags}
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                                <CardActions disableSpacing>
                                    <IconButton aria-label="add to favorites">
                                        <FavoriteIcon />
                                    </IconButton>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
                <Pagination
                    page={page}
                    count={Math.ceil(visibleFavorites.length / renderLimit)}
                    onChange={(_, value) => setPage(value)}
                    variant="outlined"
                    color="primary"
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop: 3,
                        "& .MuiPaginationItem-root": {
                            borderColor: "divider",
                            borderRadius: 0,
                        },
                    }}
                />
            </Box>
        </div>
    )
};

export default Favorites;