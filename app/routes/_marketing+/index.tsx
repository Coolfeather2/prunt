import { type MetaFunction } from '@remix-run/node'
import { Link } from '@remix-run/react'
import { Button } from '#app/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card'

export const meta: MetaFunction = () => [{ title: 'Prun Tools' }]

export default function Index() {
	return (
		<main className="font-poppins grid h-full place-items-center">
			<div className="grid place-items-center px-4 py-16 xl:gap-24">
				<div className="flex max-w-md flex-col items-center text-center">
					<svg
						className="size-20 text-foreground xl:-mt-4"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 65 65"
					>
						<path
							fill="currentColor"
							d="M39.445 25.555 37 17.163 65 0 47.821 28l-8.376-2.445Zm-13.89 0L28 17.163 0 0l17.179 28 8.376-2.445Zm13.89 13.89L37 47.837 65 65 47.821 37l-8.376 2.445Zm-13.89 0L28 47.837 0 65l17.179-28 8.376 2.445Z"
						></path>
					</svg>
					<h1
						data-heading
						className="mt-8 animate-slide-top text-4xl font-medium text-foreground [animation-delay:0.3s] [animation-fill-mode:backwards] md:text-5xl xl:mt-4	 xl:text-6xl xl:[animation-delay:0.8s] xl:[animation-fill-mode:backwards]"
					>
						Prun Tools
					</h1>
					<p
						data-paragraph
						className="mt-6 animate-slide-top text-xl/7 text-muted-foreground [animation-fill-mode:backwards] [animation-delay:0.8s] xl:mt-8 xl:animate-slide-right xl:text-xl/6 xl:leading-10 xl:[animation-fill-mode:backwards] xl:[animation-delay:1s]"
					></p>
				</div>
				<div className="mt-16 flex max-w-3xl flex-wrap justify-center gap-2 sm:gap-4">
					<Card>
						<CardHeader>
							<CardTitle>Shipping</CardTitle>
							<CardDescription>Work in Progress</CardDescription>
						</CardHeader>
						<CardContent>
							<p>• Shipping quote tool (coming soon)</p>
							<p>• Shipping status</p>
						</CardContent>
						<CardFooter>
							<Button>
								<Link to="/shipping">View</Link>
							</Button>
						</CardFooter>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Stocks</CardTitle>
							<CardDescription>Work in Progress</CardDescription>
						</CardHeader>
						<CardContent>
							<p>Display list of Materials and exchange data</p>
						</CardContent>
						<CardFooter>
							<Button>
								<Link to="/stocks">View</Link>
							</Button>
						</CardFooter>
					</Card>
				</div>
			</div>
		</main>
	)
}
