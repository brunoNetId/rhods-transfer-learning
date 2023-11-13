package org.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;


import org.tensorflow.SavedModelBundle;
import org.tensorflow.Tensor;
import org.tensorflow.Tensors;
// import org.tensorflow.ndarray.IntNdArray;
// import org.tensorflow.ndarray.NdArrays;
// import org.tensorflow.ndarray.Shape;
// import org.tensorflow.proto.framework.SignatureDef;
// import org.tensorflow.types.TInt32;

// import java.net.URISyntaxException;
// import java.net.URL;
// import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.Arrays;

import java.nio.charset.StandardCharsets;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;


// import org.tensorflow.ndarray.NdArray;
// import org.tensorflow.ndarray.NdArrays;
// import org.tensorflow.ndarray.Shape;
// import org.tensorflow.ndarray.StdArrays;
// import org.tensorflow.ndarray.buffer.DataBuffers;
// import org.tensorflow.op.Ops;
// import org.tensorflow.proto.framework.DataType;
// import org.tensorflow.types.TBool;
// import org.tensorflow.types.TFloat32;
// import org.tensorflow.types.TFloat64;
// import org.tensorflow.types.TInt32;
// import org.tensorflow.types.TInt64;
// import org.tensorflow.types.TString;


@SpringBootApplication
public class Application {

    /**
     * A main method to start this application.
     */
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);

        // load saved model
        SavedModelBundle model = SavedModelBundle.load("../../../models/tea_model_b64_jvm/1", "serve"); 

        System.out.println("model loaded: "+model);

        String base64Image = "";
        byte[] imageBytes = null;
        try{
            // Path imagePath = Paths.get("../../../dataset/images/tea-earl-grey/PXL_20230803_124233750.MP.jpg");
            Path imagePath = Paths.get("../../../dataset/images/tea-lemon/PXL_20230803_153305588.jpg");
            
            imageBytes = Files.readAllBytes(imagePath);
        }
        catch(Exception e)
        {
        	e.printStackTrace();
        }
/*
		Tensor<String> input = Tensors.create(new byte[][][]{
                {
                    // "hello".getBytes(StandardCharsets.UTF_8),
                    // "world".getBytes(StandardCharsets.UTF_8)
                    // base64Image.getBytes(StandardCharsets.UTF_8)
                    imageBytes
                }});
*/
        //Create 1-D String Tensor
		Tensor<String> input = Tensors.create(new byte[][] {imageBytes} );

		//Create Scalar String Tensor
		// Tensor<String> input = Tensors.create(imageBytes);

        // Tensor input = getTensor(imageBytes);

		// System.out.println("Shape of input is: "+Arrays.toString(input.shape()));

  //       Map<String, Tensor<?>> feed_dict = new HashMap<>();
		// feed_dict.put("image_b64", input);

		// model.function("serving_default").signature().call(feed_dict);
		// model.function(Signature.DEFAULT_KEY).signature().call(feed_dict);

// savedModel.function(Signature.DEFAULT_KEY).signature(). You can even invoke this signature directly with savedModel.call(inputTensorsMap).


		Tensor output = model
		// java.util.List<Tensor<?>> output = model
		// Object output = model
                .session()
                .runner()
                // .feed("numeric_feature", numericTensor)
                .feed("serving_default_image_b64", input)
                .fetch("StatefulPartitionedCall")
                .run()
                .get(0);

		//Get String from Scalar output
		// System.out.println("output: " + new String(output.bytesValue()));

		// System.out.println("debug: " + output.shape().length);
		// System.out.println("shape: " + output.shape()[0]);
		// System.out.println("output: " + output);

		// testGenerateParseTensor2D();

		byte[][][] classes = new byte[2][1][];
		output.copyTo(classes);

		System.out.println("TEA: "+ new String(classes[0][0]));
		System.out.println("Probability: "+ new String(classes[1][0]));
    }
/*
    public static Tensor getTensor(byte[] imageBytes){

    NdArray<String> matrix = NdArrays.ofObjects(String.class, Shape.of(1));
    // matrix.setObject(new byte[][] {imageBytes}, 0);
    matrix.setObject(new String(imageBytes), 0);

	TString t = TString.tensorOf(matrix);

    // try (TString t = TString.tensorOf(matrix)) {
    //   assertEquals(TString.class, t.type());
    //   assertEquals(DataType.DT_STRING, t.dataType());
    //   assertEquals(2, t.shape().numDimensions());
    //   assertEquals(4, t.shape().size(0));
    //   assertEquals(3, t.shape().size(1));
    //   assertEquals(matrix, t);
    // }

		return t;
    };
*/

    public static void testGenerateParseTensor2D()
    {
    	//REF: https://groups.google.com/a/tensorflow.org/g/discuss/c/IQElX7k1wSU

    	try{

	    	String[] inputs = new String[] { "HS-grad", "Male"};

			byte[][][] stringMatrix = new byte[2][1][];
			for (int i = 0; i < 2; ++i) {
				stringMatrix[i][0] = String.format(inputs[i]).getBytes("UTF-8");
			}

			Tensor<String> t = Tensors.create(stringMatrix);

			System.out.println("t shape: " + t.shape()[0]);
			System.out.println("t output: " + t);

			byte[][][] classes = new byte[2][1][];
			t.copyTo(classes);

			System.out.println("one: "+ new String(classes[0][0]));
			System.out.println("two: "+ new String(classes[1][0]));
    	}
    	catch(Exception e){
    		e.printStackTrace();
    	}

    }

}
