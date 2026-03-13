import axios from "axios";
import { useState, useEffect } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import FavoriteIcon from "@mui/icons-material/Favorite";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import SellIcon from "@mui/icons-material/Sell";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

type Meal = {
  id: string;
  strMealThumb: string;
  strTags: string;
  strCategory: string;
  strMeal: string;
};

const itemsPerPage = 24;

function MyRecipe() {
  const [created, setCreated] = useState<Meal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCreated() {
      const createdMeals = await axios.get("/api/created");
      if (createdMeals.status === 200) {
        setCreated(createdMeals.data);
      } else {
        setCreated([]);
        setError("Failed to fetch created recipes");
      }
    }

    fetchCreated();
  }, []);

  const visibleCreated = created.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <Box sx={{ width: "100%" }}>
      {error ? (
        <Box sx={{ mb: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      ) : null}

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/")}
          sx={{ alignSelf: "flex-start" }}
        >
          Back
        </Button>

        <Typography variant="h4" component="h1" sx={{ fontWeight: 800, textAlign: "center", flexGrow: 1 }}>
          My Created Recipes
        </Typography>

        <Box sx={{ width: { xs: 0, sm: 88 } }} />
      </Stack>

      <Grid container spacing={2} justifyContent="center" alignItems="flex-start">
        {visibleCreated.map((meal) => {
          const mealTags = meal.strTags
            ? meal.strTags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
            : [];

          return (
            <Grid key={meal.id}>
              <Card
                sx={{
                  width: 280,
                  height: 360,
                  cursor: "pointer",
                  borderRadius: 0,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
                variant="outlined"
              >
                <CardActionArea
                  onClick={() => navigate(`/recipe/${meal.id}`)}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                  }}
                >
                  <CardMedia
                    component="img"
                    sx={{
                      height: 190,
                      width: "100%",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                    image={meal.strMealThumb}
                    alt={meal.strMeal}
                    loading="lazy"
                  />

                  <CardContent
                    sx={{
                      flexGrow: 1,
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      textAlign: "left",
                      gap: 1.5,
                    }}
                  >
                    <Stack spacing={1} sx={{ width: "100%" }}>
                      <Typography
                        variant="h6"
                        component="h2"
                        sx={{
                          fontWeight: 800,
                          lineHeight: 1.2,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          minHeight: "2.4em",
                        }}
                      >
                        {meal.strMeal}
                      </Typography>

                      <Chip
                        icon={<RestaurantMenuIcon />}
                        label={meal.strCategory || "Uncategorized"}
                        size="small"
                        variant="outlined"
                        sx={{ borderRadius: 0, alignSelf: "flex-start" }}
                      />
                    </Stack>

                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ width: "100%" }}>
                      {mealTags.length > 0 ? (
                        mealTags.slice(0, 3).map((tag) => (
                          <Chip key={tag} icon={<SellIcon />} label={tag} size="small" sx={{ borderRadius: 0 }} />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No tags
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Pagination
        page={page}
        count={Math.max(1, Math.ceil(created.length / itemsPerPage))}
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
  );
}

export default MyRecipe;
