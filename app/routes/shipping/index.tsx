import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { type LoaderFunctionArgs, json } from '@remix-run/node'
import {
	Form,
	type MetaFunction,
	useLoaderData,
	useSearchParams,
	useRouteError,
	isRouteErrorResponse,
	Link,
} from '@remix-run/react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { PlaneLanding, PlaneTakeoff } from 'lucide-react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary'
import { Field } from '#app/components/forms'
import { Button } from '#app/components/ui/button'
import { Card } from '#app/components/ui/card'
import { Progress } from '#app/components/ui/progress'
import { StatusButton } from '#app/components/ui/status-button'
import { useIsPending } from '#app/utils/misc'

const UsernameFormSchema = z.object({
	username: z.string(),
})

dayjs.extend(relativeTime)

interface Flights {
	Segments: FlightSegment[]
	FlightId: string
	ShipId: string
	Origin: string
	Destination: string
	DepartureTimeEpochMs: number
	ArrivalTimeEpochMs: number
	CurrentSegmentIndex: number
	StlDistance: number
	FtlDistance: number
	IsAborted: boolean
	UsernameSubmitted: string
	Timestamp: string
}

interface FlightSegment {
	OriginLines: FlightLine[]
	DestinationLines: FlightLine[]
	type: string
	DepartureTimeEpochMs: number
	ArrivalTimeEpochMs: number
	StlDistance: number | null
	StlFuelConsumption: number | null
	FtlDistance: number | null
	FtlFuelConsumption: number | null
	Origin: string
	Destination: string
}

interface FlightLine {
	type: string
	LineID: string
	LineNaturalId: string
	LineName: string
}

export async function loader({ request }: LoaderFunctionArgs) {
	const usernameFilter = new URL(request.url).searchParams.get('username')
	if (usernameFilter !== null) {
		const resflights = await fetch(
			`https://rest.fnar.net/ship/flights/${usernameFilter}`,
			{ headers: { Authorization: `${process.env.FNAR_API_KEY}` } },
		)
		console.log(resflights.status)
		//handle fetch errors only return on 200
		if (resflights.ok) {
			const resFlightsJson = (await resflights.json()) as Flights[]
			return json(resFlightsJson)
		}
		//return status code to client as http status code
		throw json(null, { status: resflights.status })
	}
	return null
}

/* calculate progress percentage between two epoch dates from flights */
function calculateProgress(flight: Flights) {
	const now = Date.now()
	const departure = flight.DepartureTimeEpochMs
	const arrival = flight.ArrivalTimeEpochMs
	const progress = ((now - departure) / (arrival - departure)) * 100
	return progress
}

export default function Shipping() {
	const flights = useLoaderData<typeof loader>()
	const isPending = useIsPending()
	const [searchParams] = useSearchParams()
	const usernameURL = searchParams.get('username')

	const [form, fields] = useForm({
		id: 'username',
		constraint: getZodConstraint(UsernameFormSchema),
		defaultValue: { username: usernameURL },
		// lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: UsernameFormSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div>
			<Form className="m-5 max-w-md" method="GET" {...getFormProps(form)}>
				<Field
					className="m-1"
					labelProps={{ children: 'Username' }}
					inputProps={{
						...getInputProps(fields.username, { type: 'text' }),
						className: 'lowercase',
					}}
					errors={fields.username.errors}
				/>
				<StatusButton
					status={isPending ? 'pending' : form.status ?? 'idle'}
					type="submit"
					disabled={isPending}
				>
					Submit
				</StatusButton>
			</Form>
			<div className="m-3">
				<p>
					Public data by default, create a user and save your API key to fetch
					data available to you.
				</p>
				<p>Data may be stale from FIO.</p>
			</div>
			<hr />
			<div className="flex">
				{flights
					? flights.map(flight => {
							return <FlightDisplay key={flight.FlightId} flight={flight} />
						})
					: null}
			</div>
		</div>
	)
}

export const meta: MetaFunction = () => {
	return [{ title: 'Flight Data' }]
}

function FlightDisplay({flight}:{flight:Flights}):JSX.Element {
	return (
		<Card className="m-3 flex-1 p-5" key={flight.FlightId}>
			<p>Progress:</p>
			<div className="m-3 flex items-center space-x-3">
				<PlaneTakeoff />
				<Progress key={flight.FlightId} value={calculateProgress(flight)} />
				<PlaneLanding />
			</div>
			<hr />
			<div className="m-3">
				<p className="my-2 font-bold">Departure:</p>
				<p>
					{dayjs(flight.DepartureTimeEpochMs).format('MMM D YYYY h:mm:ss A')},{' '}
					{dayjs(flight.DepartureTimeEpochMs).fromNow()}
				</p>
				<p>
					from <b>{flight.Origin}</b>
				</p>
			</div>
			<hr />
			<div className="m-3">
				<p className="my-2 font-bold">Arrival:</p>
				<p>
					{dayjs(flight.ArrivalTimeEpochMs).format('MMM D YYYY h:mm:ss A')},{' '}
					{dayjs(flight.ArrivalTimeEpochMs).fromNow()}
				</p>
				<p>
					to <b>{flight.Destination}</b>
				</p>
			</div>
			<hr />
			<p className="my-3 font-bold">Raw Data</p>
			<div>
				<p>Flight ID: {flight.FlightId}</p>
				<p>Ship ID: {flight.ShipId}</p>
				<p>Origin: {flight.Origin}</p>
				<p>Destination: {flight.Destination}</p>
				<p>
					Departure Time:{' '}
					{new Date(flight.DepartureTimeEpochMs).toLocaleString()}
				</p>
				<p>
					Arrival Time: {new Date(flight.ArrivalTimeEpochMs).toLocaleString()}
				</p>
				<p>STL Distance: {flight.StlDistance}</p>
				<p>FTL Distance: {flight.FtlDistance}</p>
				<p>Is Aborted: {flight.IsAborted ? 'Yes' : 'No'}</p>
				<div className="ml-5">
					{flight.Segments.map((segment, index) => {
						return (
							<div key={index}>
								<br />
								<p>Segment {index + 1}</p>
								<p>Origin: {segment.Origin}</p>
								<p>Destination: {segment.Destination}</p>
								<p>
									Departure Time:{' '}
									{new Date(segment.DepartureTimeEpochMs).toLocaleString()}
								</p>
								<p>
									Arrival Time:{' '}
									{new Date(segment.ArrivalTimeEpochMs).toLocaleString()}
								</p>
								<p>STL Distance: {segment.StlDistance}</p>
								<p>STL Fuel Consumption: {segment.StlFuelConsumption}</p>
								<p>FTL Distance: {segment.FtlDistance}</p>
								<p>FTL Fuel Consumption: {segment.FtlFuelConsumption}</p>
								<div className="ml-5">
									{segment.OriginLines.map((line, index) => {
										return (
											<div key={index}>
												<br />
												<p>Origin Line {index + 1}</p>
												<p>Line ID: {line.LineID}</p>
												<p>Line Natural ID: {line.LineNaturalId}</p>
												<p>Line Name: {line.LineName}</p>
											</div>
										)
									})}
								</div>
								<div className="ml-5">
									{segment.DestinationLines.map((line, index) => {
										return (
											<div key={index}>
												<br />
												<p>Destination Line {index + 1}</p>
												<p>Line ID: {line.LineID}</p>
												<p>Line Natural ID: {line.LineNaturalId}</p>
												<p>Line Name: {line.LineName}</p>
											</div>
										)
									})}
								</div>
							</div>
						)
					})}
				</div>
			</div>
		</Card>
	)
}

export function ErrorBoundary() {
	const error = useRouteError()
	const [searchParams] = useSearchParams()
	const usernameURL = searchParams.get('username')

	if (isRouteErrorResponse(error)) {
		switch (error.status) {
			case 401:
				return (
					<div className='items-center justify-center p-20'>
						<p>You don't have access to view this users shipping data.</p>
						<p>
							Contact {usernameURL} to provide you access to their FIO flight
							data.
						</p>
						<Button asChild>
							<Link to="/shipping">Go Back</Link>
						</Button>
					</div>
				)
		}

		return (
			<div>
				Something went wrong: {error.status} {error.statusText}
			</div>
		)
	}

	return <GeneralErrorBoundary />
}
