import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Paper,
  Rating,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Favorite,
  FavoriteBorder,
  Public,
  Restaurant,
  Sell,
  Star,
} from "@mui/icons-material";
import CommentSection from "./CommentSection";

interface RecipeIngredient {
  name: string;
  measure: string;
}

interface Recipe {
  id: number;
  strMeal: string;
  strMealThumb: string;
  strInstructions: string;
  strCategory?: string;
  strArea?: string;
  strTags?: string;
  ingredients?: RecipeIngredient[];
}

function parseInstructions(instructions: string) {
  if (!instructions) return [] as string[];

  const lines = instructions
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !/^(step\s*\d+|\d+\.)$/i.test(line));

  const combined: string[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].endsWith(":") && index + 1 < lines.length) {
      combined.push(`${lines[index]} ${lines[index + 1]}`);
      index += 1;
    } else {
      combined.push(lines[index]);
    }
  }

  return combined;
}

export default function Recipe() {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [userRating, setUserRating] = useState<number | null>(null);

  const refreshRatings = async () => {
    const ratingResponse = (await axios.get(`/api/recipe/${id}/rating`)).data;
    setRating(ratingResponse.rating);
    setRatingCount(ratingResponse.amount);

    try {
      const userRatingResponse = (await axios.get(`/api/recipe/${id}/user-rating`)).data;
      setUserRating(userRatingResponse.rating);
    } catch {
      setUserRating(null);
    }
  };

  const submitRating = async (_event: React.SyntheticEvent, value: number | null) => {
    if (!value) return;

    setError(null);
    try {
      const response = await axios.post(`/api/recipe/${id}/rating`, { rating: value });
      if (!response.data.ok) {
        setError(response.data.error || "Failed to submit rating");
        return;
      }

      setUserRating(value);
      await refreshRatings();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || "Failed to submit rating");
      } else {
        setError("Failed to submit rating");
      }
    }
  };

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const recipeResponse = (await axios.get(`/api/recipe/${id}`)).data as Recipe;
        const ingredientRows = (await axios.get(`/api/recipe/${id}/ingredients`)).data;

        const ingredients = await Promise.all(
          ingredientRows.map(async (ingredient: { idIngredient: number; measure: string }) => {
            const ingredientResponse = await axios.get(`/api/ingredient/${ingredient.idIngredient}`);
            return {
              name: ingredientResponse.data.name,
              measure: ingredient.measure,
            } satisfies RecipeIngredient;
          }),
        );

        recipeResponse.ingredients = ingredients;
        setRecipe(recipeResponse);

        await refreshRatings();

        try {
          const favoriteResponse = await axios.get(`/api/favorites/${id}`);
          setIsFavorite(favoriteResponse.data.isFavorite);
        } catch {
          setIsFavorite(false);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch recipe");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  const tags = useMemo(
    () =>
      recipe?.strTags
        ? recipe.strTags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : [],
    [recipe?.strTags],
  );

  const instructions = useMemo(
    () => parseInstructions(recipe?.strInstructions || ""),
    [recipe?.strInstructions],
  );

  const addToFavorites = async (recipeId: number) => {
    await axios.post(`/api/favorites`, { data: { recipeId } });
  };

  const removeFromFavorites = async (recipeId: number) => {
    await axios.delete(`/api/favorites`, { data: { recipeId } });
  };

  const toggleFavorite = async () => {
    if (!recipe) return;

    setError(null);
    const nextValue = !isFavorite;
    setIsFavorite(nextValue);

    try {
      if (nextValue) {
        await addToFavorites(recipe.id);
      } else {
        await removeFromFavorites(recipe.id);
      }
    } catch (err) {
      setIsFavorite(!nextValue);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || "Failed to update favorites");
      } else {
        setError("Failed to update favorites");
      }
    }
  };

  if (loading) {
    return (
      <Container maxWidth={false} sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, md: 4 } }}>
        <Paper
          elevation={0}
          sx={{
            minHeight: 320,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            borderRadius: 0,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <CircularProgress color="primary" />
          <Typography variant="h6">Loading recipe...</Typography>
        </Paper>
      </Container>
    );
  }

  if (!loading && !recipe) {
    return (
      <Container maxWidth={false} sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, md: 4 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        <Alert severity="info">Recipe not found.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, md: 4 } }}>
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        {recipe && (
          <>
            <Paper
              elevation={0}
              sx={{
                overflow: "hidden",
                borderRadius: 0,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", lg: "minmax(320px, 480px) 1fr" },
                }}
              >
                <Box
                  component="img"
                  src={recipe.strMealThumb}
                  alt={recipe.strMeal}
                  sx={{
                    width: "100%",
                    height: { xs: 280, sm: 360, lg: "100%" },
                    minHeight: { lg: 520 },
                    objectFit: "cover",
                    display: "block",
                  }}
                />

                <Box sx={{ p: { xs: 3, sm: 4, md: 5 }, bgcolor: "background.paper" }}>
                  <Stack spacing={2.5}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      justifyContent="space-between"
                      spacing={2}
                    >
                      <Box>
                        <Typography variant="overline" color="primary" sx={{ letterSpacing: 1.5 }}>
                          Recipe details
                        </Typography>
                        <Typography
                          variant="h3"
                          component="h1"
                          sx={{ fontWeight: 800, lineHeight: 1.1, mt: 0.5 }}
                        >
                          {recipe.strMeal}
                        </Typography>
                      </Box>

                      <Tooltip title={isFavorite ? "Remove from favorites" : "Add to favorites"}>
                        <IconButton
                          onClick={toggleFavorite}
                          aria-label="toggle favorite"
                          sx={{
                            width: 56,
                            height: 56,
                            border: "1px solid",
                            borderColor: isFavorite ? "error.main" : "divider",
                            bgcolor: isFavorite ? "rgba(181, 66, 44, 0.08)" : "background.paper",
                            borderRadius: 0,
                          }}
                        >
                          {isFavorite ? <Favorite color="error" /> : <FavoriteBorder />}
                        </IconButton>
                      </Tooltip>
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Rating
                          value={rating ?? 0}
                          precision={0.5}
                          readOnly
                          emptyIcon={<Star style={{ opacity: 0.35 }} fontSize="inherit" />}
                        />
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {typeof rating === "number" && ratingCount > 0
                            ? `${rating.toFixed(1)} (${ratingCount})`
                            : "Unrated"}
                        </Typography>
                      </Stack>

                      {recipe.strCategory && (
                        <Chip
                          icon={<Restaurant />}
                          label={recipe.strCategory}
                          color="primary"
                          variant="outlined"
                        />
                      )}
                      {recipe.strArea && (
                        <Chip icon={<Public />} label={recipe.strArea} variant="outlined" />
                      )}
                    </Stack>

                    {tags.length > 0 && (
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {tags.map((tag) => (
                          <Chip key={tag} icon={<Sell />} label={tag} size="small" />
                        ))}
                      </Stack>
                    )}

                    <Divider />

                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                        Your rating
                      </Typography>
                      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                        <Rating value={userRating} onChange={submitRating} precision={1} size="large" />
                        <Typography variant="body2" color="text.secondary">
                          Click a star to rate this recipe.
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              </Box>
            </Paper>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", xl: "420px minmax(0, 1fr)" },
                gap: 3,
                alignItems: "start",
                width: "100%",
              }}
            >
              <Card
                elevation={0}
                sx={{
                  borderRadius: 0,
                  border: "1px solid",
                  borderColor: "divider",
                  position: { xl: "sticky" },
                  top: { xl: 96 },
                  width: "100%",
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                    Ingredients
                  </Typography>
                  <Stack spacing={1.25}>
                    {recipe.ingredients?.map((ingredient, index) => (
                      <Box
                        key={`${ingredient.name}-${index}`}
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 2,
                          py: 1,
                          borderBottom:
                            index === (recipe.ingredients?.length ?? 0) - 1 ? "none" : "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {ingredient.name}
                        </Typography>
                        <Chip label={ingredient.measure || "To taste"} size="small" variant="outlined" />
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>

              <Stack spacing={3} sx={{ width: "100%" }}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 0,
                    border: "1px solid",
                    borderColor: "divider",
                    width: "100%",
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 2.5 }}>
                      Instructions
                    </Typography>

                    <Stack spacing={2}>
                      {instructions.map((step, index) => (
                        <Paper
                          key={`${index + 1}-${step.slice(0, 24)}`}
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 0,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.default",
                          }}
                        >
                          <Stack direction="row" spacing={2} alignItems="flex-start">
                            <Box
                              sx={{
                                minWidth: 40,
                                height: 40,
                                display: "grid",
                                placeItems: "center",
                                bgcolor: "primary.main",
                                color: "primary.contrastText",
                                fontWeight: 700,
                                borderRadius: 0,
                              }}
                            >
                              {index + 1}
                            </Box>
                            <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                              {step}
                            </Typography>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>

                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 0,
                    border: "1px solid",
                    borderColor: "divider",
                    width: "100%",
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                      Discussion
                    </Typography>
                    <CommentSection recipeId={recipe.id} />
                  </CardContent>
                </Card>
              </Stack>
            </Box>
          </>
        )}
      </Stack>
    </Container>
  );
}
