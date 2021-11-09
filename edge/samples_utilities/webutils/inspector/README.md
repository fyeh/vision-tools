# MVI Edge Inspector

This web sample demonstrates the use of the Controller REST API for retrieving images and associated metadata for an inspection and rendering the inference results on the image. It also indicates rules results as colored borders around the images and alerts with rounded borders.

The `Login/Logout` button will create and end sessions with the controller.
> The default userid and password are hard-coded but can be over-ridden

# Inspections

After logging in all inspections are displayed along with their summary statistics.

# Inspect Images

Clicking the name of an inspection displays all of its images in a table and clicking any image in the table renders the image with bounding boxes from the inference metadata and displays the metadata for the image in a text area below the rendered image.

# API Notes

When an inspection is selected, a GET request to *~/api/v1/inspections/images/filterdata* is made to retrieve metadata for all the inspection's images. This endpoint is intentionally as sparse as possible to minimize network transfer time on large data sets. The keys in the returned JSON objects are:

```
{
  u: is the uuid of the inspection
  i: [ is an array of all images for the inspection
    {
      c: is the image creation timestamp
      f: is the image filename
      d: [ is an array of all rule results for the image
        {
          a: is a boolean indicating if an alert is associated with the rule result
          r: is the rules result - one of "pass', "fail", or "inconclusive"
        }
      ]
    }
  ]
}
```

Retrieving an image's details from the metadata returned in the *filterdata* response is achieved with a GET to *~/opt/ibm/vision-edge/images/\<inspection uuid\>/\<image filename\>*.