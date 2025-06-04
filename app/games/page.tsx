import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Component() {
  const games = [
    {
      id: 1,
      title: "Tower Defender",
      description: "Basic Tower Defender game for my Tutorials.",
      genre: "Tower Defense",
      image: "/TowerDefenderGameScreen.png?height=300&width=500",
      link: "/towerDefender.html",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Featured Games</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          This is a mix of my tutorial games, my Jam games, and personal game
          projects.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <Card
            key={game.id}
            className="overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <div className="relative">
              <Image
                src={game.image}
                alt={`${game.title} screenshot`}
                width={500}
                height={300}
                className="w-full h-48 object-cover"
              />
            </div>

            <CardHeader>
              <CardTitle className="text-xl">{game.title}</CardTitle>
            </CardHeader>

            <CardContent>
              <CardDescription className="text-sm leading-relaxed">
                {game.description}
              </CardDescription>
            </CardContent>

            <CardFooter>
              <Button asChild className="w-full">
                <Link
                  href={game.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Play Now
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
