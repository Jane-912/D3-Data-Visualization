async function drawScatter() {

  // 1. Access data

  const dataset = await d3.json("./data/my_weather_data.json")

  // set data constants
  // Get data attributes, i.e. xAccesstor for max temperature and yAccessor for min temperature 
  const xAccessor = d => d.temperatureMin
  const yAccessor = d => d.temperatureMax
  const colorScaleYear = 2000
  const parseDate = d3.timeParse("%Y-%m-%d")
  const colorAccessor = d => parseDate(d.date).setYear(colorScaleYear)
 


  // Create chart dimensions

  const width = d3.min([
    window.innerWidth * 0.75,
    window.innerHeight * 0.75,
  ])
  let dimensions = {
    width: width,
    height: width,
    margin: {
      top: 90,
      right: 90,
      bottom: 50,
      left: 50,
    },
    legendWidth: 250,
    legendHeight: 26,
    histogramMargin: 10,
    histogramHeight: 70,
  }
  dimensions.boundedWidth = dimensions.width
    - dimensions.margin.left
    - dimensions.margin.right
  dimensions.boundedHeight = dimensions.height
    - dimensions.margin.top
    - dimensions.margin.bottom

  // Draw 

  const wrapper = d3.select("#wrapper")
    .append("svg")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)

  const bounds = wrapper.append("g")
    .style("transform", `translate(${
      dimensions.margin.left
    }px, ${
      dimensions.margin.top
    }px)`)

  const boundsBackground = bounds.append("rect") // freezing temperature = 0
      .attr("class", "bounds-background")
      .attr("x", 0)
      .attr("width", dimensions.boundedWidth)
      .attr("y", 0)
      .attr("height", dimensions.boundedHeight)

  // Create scales

  // Create scales for x, y, and color (i.e., xScale, yScale, and colorScale)
  const temperaturesExtent = d3.extent([
    ...dataset.map(xAccessor),
    ...dataset.map(yAccessor),
    ])
  const xScale = d3.scaleLinear()
    .domain(temperaturesExtent)  
    .range([0, dimensions.boundedWidth])
    .nice();

  const yScale = d3.scaleLinear()
    .domain(temperaturesExtent)
    .range([dimensions.boundedHeight, 0])
    .nice();
  
  const colorScale = d3.scaleSequential()
      .domain([d3.timeParse("%m/%d/%Y")(`1/1/${colorScaleYear}`),
       d3.timeParse("%m/%d/%Y")(`12/31/${colorScaleYear}`)])
      .interpolator(d => d3.interpolateRainbow(-d))

  // 5. Draw data 

  // draw data into a scatter plot

  const dotsGroup = bounds.append("g")
  const dots =  bounds.selectAll(".dot")
      .data(dataset, d => d[0])
      .join("circle")
      .attr("class","dot")
      .attr("cx", d => xScale(xAccessor(d)))
      .attr("cy", d => yScale(yAccessor(d)))
      .attr("r", 3)
      .style("fill", d => colorScale(colorAccessor(d)))

  // 6. Draw peripherals
  const topHistogrmGenerator = d3.histogram()
    .domain(xScale.domain())
    .value(xAccessor)
    .thresholds(20)

  const topHistogramBins = topHistogrmGenerator(dataset)
  
  const topHistogramYScale = d3.scaleLinear()
  .domain(d3.extent(topHistogramBins, d => d.length))
  .range([dimensions.histogramHeight,0])

  const topHistogramBounds = bounds.append("g")
  .attr("transform", `translate(0,${-dimensions.histogramHeight-dimensions.histogramMargin})`)

  const topHistogrmLineGenerator = d3.area()
  .x(d => xScale((d.x0 + d.x1) / 2))
  .y0(dimensions.histogramHeight)
  .y1(d => topHistogramYScale(d.length))
  .curve(d3.curveBasis)

  const topHistogramElement = topHistogramBounds.append("path")
    .attr("d", d=> topHistogrmLineGenerator(topHistogramBins))
    .attr("class" , "histogram-area")
  
  const rightHistogrmGenerator = d3.histogram()
    .domain(yScale.domain())
    .value(yAccessor)
    .thresholds(20)

  const rightHistogramBins = rightHistogrmGenerator(dataset)

  const rightHistogramYScale = d3.scaleLinear()
  .domain(d3.extent(rightHistogramBins, d => d.length))
  .range([dimensions.histogramHeight,0])

  const rightHistogramBounds = bounds.append("g")
  .attr("class", "right-histogram")
  .style("transform", `translate(${dimensions.boundedWidth + dimensions.histogramMargin}px, -${dimensions.histogramHeight}px) rotate(90deg)`)

  const rightHistogrmLineGenerator = d3.area()
  .x(d => yScale((d.x0 + d.x1) / 2))
  .y0(dimensions.histogramHeight)
  .y1(d => rightHistogramYScale(d.length))
  .curve(d3.curveBasis)

  const rightHistogramElement = rightHistogramBounds.append("path")
    .attr("d", d=> rightHistogrmLineGenerator(rightHistogramBins))
    .attr("class" , "histogram-area")



  const xAxisGenerator = d3.axisBottom()
    .scale(xScale)
    .ticks(4)

  const xAxis = bounds.append("g")
    .call(xAxisGenerator)
    .style("transform", `translateY(${dimensions.boundedHeight}px)`)

  const xAxisLabel = xAxis.append("text")
      .attr("class", "x-axis-label")
      .attr("x", dimensions.boundedWidth / 2)
      .attr("y", dimensions.margin.bottom - 10)
      .html("Minimum Temperature (&deg;F)")

  const yAxisGenerator = d3.axisLeft()
    .scale(yScale)
    .ticks(4)

  const yAxis = bounds.append("g")
      .call(yAxisGenerator)

  const yAxisLabel = yAxis.append("text")
      .attr("class", "y-axis-label")
      .attr("x", -dimensions.boundedHeight / 2)
      .attr("y", -dimensions.margin.left + 10)
      .html("Maximum Temperature (&deg;F)")

  const legendGroup = bounds.append("g")
      .attr("transform", `translate(${
        dimensions.boundedWidth - dimensions.legendWidth - 9
      },${
        dimensions.boundedHeight - 37
      })`)

  const defs = wrapper.append("defs")

  const numberOfGradientStops = 10
  const stops = d3.range(numberOfGradientStops).map(i => (
    i / (numberOfGradientStops - 1)
  ))
  const legendGradientId = "legend-gradient"
  const gradient = defs.append("linearGradient")
      .attr("id", legendGradientId)
      .selectAll("stop")
      .data(stops)
      .join("stop")
      .attr("stop-color", d => d3.interpolateRainbow(-d))
      .attr("offset", d => `${d * 100}%`)

  const legendGradient = legendGroup.append("rect")
      .attr("height", dimensions.legendHeight)
      .attr("width", dimensions.legendWidth)
      .style("fill", `url(#${legendGradientId})`)

  const tickValues = [
    d3.timeParse("%m/%d/%Y")(`4/1/${colorScaleYear}`),
    d3.timeParse("%m/%d/%Y")(`7/1/${colorScaleYear}`),
    d3.timeParse("%m/%d/%Y")(`10/1/${colorScaleYear}`),
  ]
  const legendTickScale = d3.scaleLinear()
      .domain(colorScale.domain())
      .range([0, dimensions.legendWidth])

  const legendValues = legendGroup.selectAll(".legend-value")
    .data(tickValues)
    .join("text")
      .attr("class", "legend-value")
      .attr("x", legendTickScale)
      .attr("y", -6)
      .text(d3.timeFormat("%b"))

  const legendValueTicks = legendGroup.selectAll(".legend-tick")
    .data(tickValues)
    .join("line")
      .attr("class", "legend-tick")
      .attr("x1", legendTickScale)
      .attr("x2", legendTickScale)
      .attr("y1", 6)

  // Set up interactions

const voronoiGenerator = d3.voronoi()
  .x(d => xScale(xAccessor(d)))
  .y(d => yScale(yAccessor(d)))
  .extent([
    [0, 0],
    [dimensions.boundedWidth, dimensions.boundedHeight]
  ])

const voronoiPolygons = voronoiGenerator.polygons(dataset)

const voronoi = dotsGroup.selectAll(".voronoi")
.data(voronoiPolygons)
  .enter().append("polygon")
  .attr("class", "voronoi")
  .attr("points", (d=[]) => (
    d.map(point => (
      point.join(",")
    )).join(" ")
  ))
  // add two mouse events in the tooltip

  voronoi.on("mouseenter", onVoronoiMouseEnter)
    .on("mouseleave", onVoronoiMouseLeave)

  const tooltip = d3.select("#tooltip")
  const hoverElementsGroup = bounds.append("g")
      .attr("opacity", 0)

  const dayDot = hoverElementsGroup.append("circle")
      .attr("class", "tooltip-dot")

  const horizontalLine = hoverElementsGroup.append("rect")
    .attr("class","hover-line")
  const verticalLine = hoverElementsGroup.append("rect")
    .attr("class","hover-line")
  
  function onVoronoiMouseEnter(vdatum) { // event, d
    //Given the mouse event and a datum, you are asked to highlight the data by adding an addtioanl circle and display its information (such as date and temperature).
    hoverElementsGroup.style("opacity", 1)
    const datum = vdatum.data
    const x = xScale(xAccessor(datum))
    const y = yScale(yAccessor(datum))
    const hoverLineThickness = 10
    const formatTemperature = d3.format(".1f")
    tooltip.select("#min-temperature")
           .text(formatTemperature(xAccessor(datum)))
    tooltip.select("#max-temperature")
          .text(formatTemperature(yAccessor(datum)))
    const dateParser = d3.timeParse("%Y-%m-%d")
    const formatDate = d3.timeFormat("%A %B %-d, %Y")
    tooltip.select("#date")
          .text(formatDate(dateParser(datum.date)))
    
    // const tooltipX = x 
    const tooltipX = x - dimensions.margin.left - 12
    const tooltipY = y

    tooltip.style('left', tooltipX + 'px')
          .style('top', tooltipY + 'px')
          .style("opacity", 1)

    dayDot.attr("cx", d => x)
          .attr("cy", d => y)
          .attr("r", 7)
        
    horizontalLine.attr("x", x)
          .attr("y", y - hoverLineThickness / 2)
          .attr("width", dimensions.boundedWidth
          + dimensions.histogramMargin
          + dimensions.histogramHeight
           - x)
           .attr("height", hoverLineThickness)
    verticalLine.attr("x", x - hoverLineThickness / 2)
        .attr("y", -dimensions.histogramMargin
        - dimensions.histogramHeight) 
        .attr("width", hoverLineThickness)
        .attr("height", y
          + dimensions.histogramMargin
          + dimensions.histogramHeight)     
  }

  function onVoronoiMouseLeave() {
    hoverElementsGroup.style("opacity", 0)
    tooltip.style("opacity", 0)
  }

  // add two mouse actions on the legend
  legendGradient.on("mousemove", onLegendMouseMove)
    .on("mouseleave", onLegendMouseLeave)

  const legendHighlightBarWidth = dimensions.legendWidth * 0.05
  const legendHighlightGroup = legendGroup.append("g")
      .attr("opacity", 0)
  const legendHighlightBar = legendHighlightGroup.append("rect")
      .attr("class", "legend-highlight-bar")
      .attr("width", legendHighlightBarWidth)
      .attr("height", dimensions.legendHeight)

  const legendHighlightText = legendHighlightGroup.append("text")
      .attr("class", "legend-highlight-text")
      .attr("x", legendHighlightBarWidth / 2)
      .attr("y", -6)

  const hoverTopHistogram = topHistogramBounds.append("path")
  const hoverRightHistogram = rightHistogramBounds.append("path")

  function onLegendMouseMove(e) {

    // Display the data only when the data are in the selected date range.
    const pos = d3.mouse(this)
    const x = pos[0]
    const minDateToHighlight = new Date(
      legendTickScale.invert( x - legendHighlightBarWidth)
    )
    const maxDateToHighlight = new Date(
      legendTickScale.invert(x + legendHighlightBarWidth)
    )
    const barX = d3.median([
      0,
      x - legendHighlightBarWidth / 2,
      dimensions.legendWidth - legendHighlightBarWidth,
    ])
    legendHighlightGroup.style("opacity",1)
    .style("transform", `translateX(${barX}px)`)
    const formatLegendDate = d3.timeFormat("%b %d")
    legendHighlightText.text([
      formatLegendDate(minDateToHighlight),
      formatLegendDate(maxDateToHighlight),
    ].join(" - "))

    legendValues.style("opacity", 0)
    legendValueTicks.style("opacity", 0)

    dots.transition().duration(100)
        .style("opacity", 0.08)
        .attr("r", 2)

    const getYear = d => +d3.timeFormat("%Y")(d)
    const isDayWithinRange = d => {
      // Given a datum, judge whether the datum is in a datum range. Return True or False. 
      const date = colorAccessor(d)
      if (getYear(minDateToHighlight) < colorScaleYear){
        return date >= new Date(minDateToHighlight)
        .setYear(colorScaleYear)
        || date <= maxDateToHighlight
      } else if (getYear(maxDateToHighlight) > colorScaleYear){
        return date <= new Date(maxDateToHighlight)
        .setYear(colorScaleYear)
        || date >= minDateToHighlight
      } else {
        return date >= minDateToHighlight
        && date <= maxDateToHighlight
      }
    }
    const relevantDots = dots.filter(isDayWithinRange)
    .transition().duration(100)
    .style("opacity",1)
    .attr("r", 4)

    const hoveredDate = d3.isoParse(legendTickScale.invert(x))
    const hoveredDates = dataset.filter(isDayWithinRange)
    hoverTopHistogram.attr("d", d => (
      topHistogrmLineGenerator(topHistogrmGenerator(hoveredDates))
    )).attr("fill",colorScale(hoveredDate))
    .attr("stroke","white")
    .style("opacity",1)
    hoverRightHistogram.attr("d", d => (
      rightHistogrmLineGenerator(rightHistogrmGenerator(hoveredDates))
    )).attr("fill",colorScale(hoveredDate))
    .attr("stroke","white")
    .style("opacity",1)
  }

  function onLegendMouseLeave() {
    dotsGroup.selectAll(".dot")
      .transition().duration(500)
        .style("opacity", 1)
        .attr("r", 4)

    legendValues.style("opacity", 1)
    legendValueTicks.style("opacity", 1)
    legendHighlightGroup.style("opacity", 0)
    hoverTopHistogram.style("opacity", 0)
    hoverRightHistogram.style("opacity", 0)
  }

}
drawScatter()