import { Component, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import * as nipplejs from 'nipplejs';
import * as ROSLIB from 'roslib';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('videoElement') videoElement!: ElementRef;
  isForward: boolean = true;
  private ros!: ROSLIB.Ros;
  private leftJoystickPublisher!: ROSLIB.Topic;
  private rightJoystickPublisher!: ROSLIB.Topic;

  // Set the video URL to the Raspberry Pi stream
  videoUrl: string = 'http://192.168.1.29:8080/?action=stream';

  ngOnInit() {
    this.initRosConnection();
    this.initJoystick();
  }

  ngAfterViewInit() {
    this.startCameraFeed();
  }

  startCameraFeed() {
    console.log('Streaming camera from:', this.videoUrl);
  }

  toggleDirection() {
    this.isForward = !this.isForward;
  }

  initRosConnection() {
    this.ros = new ROSLIB.Ros({
      url: 'ws://192.168.1.29:9090' // Replace with actual IP
    });

    this.ros.on('connection', () => {
      console.log('Connected to ROS 2 via rosbridge');
    });

    this.ros.on('error', (error: any) => { 
      console.error('WebSocket Error:', error);
    });
    

    this.ros.on('close', () => {
      console.log('Connection to rosbridge closed.');
    });

    // Define publishers for joystick topics
    this.leftJoystickPublisher = new ROSLIB.Topic({
      ros: this.ros,
      name: '/joystick_left',
      messageType: 'geometry_msgs/Twist'
    });

    this.rightJoystickPublisher = new ROSLIB.Topic({
      ros: this.ros,
      name: '/steering_angle',
      messageType: 'std_msgs/Float32'
    });
  }

  sendJoystickCommand(publisher: ROSLIB.Topic, angle: number) {
    console.log(`Publishing to ${publisher.name}: angle=${angle}`);
    
    const message = new ROSLIB.Message({
      data: angle
    });

    publisher.publish(message);
  }


  initJoystick() {
    const leftJoystickElement = document.getElementById('joystick-left');
    const rightJoystickElement = document.getElementById('joystick-right');

    // if (leftJoystickElement) {
    //   const leftJoystick = nipplejs.create({
    //     zone: leftJoystickElement,
    //     mode: 'static',
    //     position: { left: '50%', top: '50%' },
    //     color: 'blue',
    //     size: 100,
    //     lockY: true // Left joystick moves only up/down
    //   });

    //   leftJoystick.on('move', (event, data) => {
    //     const x = 0.0; // No rotation for left joystick
    //     const y = data.force; // Movement speed based on joystick force
    //     console.log('Joystick Left:', y);
    //     this.sendJoystickCommand(this.leftJoystickPublisher, x, y);
    //   });

    //   leftJoystick.on('end', () => {
    //     this.sendJoystickCommand(this.leftJoystickPublisher, 0, 0);
    //   });
    // }

    if (rightJoystickElement) {
      const rightJoystick = nipplejs.create({
        zone: rightJoystickElement,
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'red',
        size: 100,
        lockX: true // Right joystick moves only left/right
      });

      rightJoystick.on('move', (event, data) => {
        if (!data.distance || !data.angle) return; // Ignore if no movement detected
         // Map the joystick's horizontal angle (0° to 180°)
        let degrees = Math.round((data.angle.degree / 180) * 180);
        console.log(`Joystick Right Angle: ${degrees}°`);
        this.sendJoystickCommand(this.rightJoystickPublisher, degrees);
      });

      rightJoystick.on('end', () => {
        this.sendJoystickCommand(this.rightJoystickPublisher, 90);
      });
    }
  }
}
